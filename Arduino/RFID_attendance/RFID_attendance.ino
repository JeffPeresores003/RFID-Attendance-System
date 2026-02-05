#include <SPI.h>
#include <MFRC522.h>

// Pin configuration for RC522
#define SS_PIN 10
#define RST_PIN 9

MFRC522 mfrc522(SS_PIN, RST_PIN);  // Create MFRC522 instance

void setup() {
  Serial.begin(9600); // Must match server baud rate
  SPI.begin();
  mfrc522.PCD_Init();
  Serial.println("RFID Attendance System Started");
  Serial.println("Scan a student card...");
  pinMode(LED_BUILTIN, OUTPUT);
}

String getUID(MFRC522::Uid uid) {
  String uidStr = "";
  for (byte i = 0; i < uid.size; i++) {
    if (uid.uidByte[i] < 0x10) uidStr += "0";
    uidStr += String(uid.uidByte[i], HEX);
  }
  uidStr.toUpperCase();
  return uidStr;
}

// LED pattern state machine
enum Pattern { P_IDLE, P_SCAN_ONCE, P_REGISTRATION, P_PAUSED, P_SUCCESS, P_FAIL };
Pattern currentPattern = P_IDLE;
unsigned long patternStart = 0;

// For non-blocking duplicate prevention
unsigned long lastScanTime = 0;
const unsigned long scanDebounceMs = 800;

// For success pattern
int successStep = 0;
unsigned long successLastToggle = 0;

void setPattern(Pattern p) {
  currentPattern = p;
  patternStart = millis();
  successStep = 0;
  successLastToggle = 0;
}

void updateLed() {
  unsigned long t = millis() - patternStart;
  switch (currentPattern) {
    case P_IDLE:
      digitalWrite(LED_BUILTIN, LOW);
      break;
    case P_SCAN_ONCE:
      // single short blink then return to idle
      if (t < 75) digitalWrite(LED_BUILTIN, HIGH);
      else {
        digitalWrite(LED_BUILTIN, LOW);
        setPattern(P_IDLE);
      }
      break;
    case P_REGISTRATION:
      // fast blink (on 150ms / off 150ms)
      if ((t % 300) < 150) digitalWrite(LED_BUILTIN, HIGH);
      else digitalWrite(LED_BUILTIN, LOW);
      break;
    case P_PAUSED:
      // slow pulse (on 400ms / off 1200ms)
      if ((t % 1600) < 400) digitalWrite(LED_BUILTIN, HIGH);
      else digitalWrite(LED_BUILTIN, LOW);
      break;
    case P_SUCCESS:
      // three short blinks then idle
      if (successStep >= 6) { // 3 on/off cycles done
        setPattern(P_IDLE);
      } else {
        if (millis() - successLastToggle >= 120) {
          // toggle
          bool on = (successStep % 2) == 0;
          digitalWrite(LED_BUILTIN, on ? HIGH : LOW);
          successStep++;
          successLastToggle = millis();
        }
      }
      break;
    case P_FAIL:
      // rapid two blinks then idle
      if (t < 200) digitalWrite(LED_BUILTIN, HIGH);
      else if (t < 400) digitalWrite(LED_BUILTIN, LOW);
      else if (t < 600) digitalWrite(LED_BUILTIN, HIGH);
      else digitalWrite(LED_BUILTIN, LOW), setPattern(P_IDLE);
      break;
  }
}

void handleSerialCommands() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.length() == 0) return;
    // Recognized commands sent from server (optional):
    // START_REG, CANCEL_REG, SCANNING_PAUSED, SCANNING_RESUMED, REG_SUCCESS, REG_FAIL
    if (cmd == "START_REG") {
      setPattern(P_REGISTRATION);
    } else if (cmd == "CANCEL_REG") {
      setPattern(P_IDLE);
    } else if (cmd == "SCANNING_PAUSED") {
      setPattern(P_PAUSED);
    } else if (cmd == "SCANNING_RESUMED") {
      setPattern(P_IDLE);
    } else if (cmd == "REG_SUCCESS") {
      setPattern(P_SUCCESS);
    } else if (cmd == "REG_FAIL") {
      setPattern(P_FAIL);
    }
  }
}

void loop() {
  // Update LED according to current pattern (non-blocking)
  updateLed();

  // Handle incoming serial commands from host/server
  handleSerialCommands();

  // Check if a new card is present
  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  unsigned long now = millis();
  if (now - lastScanTime < scanDebounceMs) {
    // ignore duplicate rapid reads
    return;
  }
  lastScanTime = now;

  String uid = getUID(mfrc522.uid);  // Get card UID

  // Trigger scan pattern
  setPattern(P_SCAN_ONCE);

  Serial.println(uid);               // Send UID to server via Serial
}
