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

void loop() {
  // Check if a new card is present
  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  String uid = getUID(mfrc522.uid);  // Get card UID
  Serial.println(uid);               // Send UID to server via Serial

  delay(800); // Delay to prevent duplicate scans
}
