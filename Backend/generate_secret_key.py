"""
Generate a secure session secret key for production use.
Run this script to generate a random secret key.
"""
import secrets

# Generate a 32-byte (256-bit) random key and encode it as URL-safe base64
secret_key = secrets.token_urlsafe(32)
print("\n" + "="*60)
print("Generated Session Secret Key:")
print("="*60)
print(secret_key)
print("="*60)
print("\nAdd this to your Backend/.env file:")
print(f"SESSION_SECRET_KEY={secret_key}")
print("\n⚠️  Keep this key secret! Never commit it to version control.")
print("="*60 + "\n")

