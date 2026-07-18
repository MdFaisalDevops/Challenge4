import dotenv from 'dotenv';
import path from 'path';

// Load local configurations
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Secrets Manager Utility
 * Abstracts database credentials and API keys.
 * In local dev, reads from .env; in production GCP, can be extended 
 * to load secrets dynamically from Google Secret Manager (@google-cloud/secret-manager).
 */
export class SecretsManager {
  // Retrieve target secret by name
  public static async getSecret(name: string): Promise<string> {
    // If running in Google Cloud Run / standard GCP node environment,
    // we could dynamically fetch the secret from Secret Manager client.
    // Fallback: read directly from process.env configurations
    const val = process.env[name];
    if (!val) {
      console.warn(`[secrets-manager]: Warning: Secret key "${name}" is not loaded.`);
      return '';
    }
    return val;
  }

  // Helper getters
  public static async getGeminiApiKey(): Promise<string> {
    return this.getSecret('GEMINI_API_KEY');
  }

  public static async getFirebaseProjectId(): Promise<string> {
    return this.getSecret('FIREBASE_PROJECT_ID');
  }
}
