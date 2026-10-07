/*
 * TRADERS DE ELITE — Appwrite
 * Configuração central do backend.
 */

const APPWRITE_ENDPOINT = "https://fra.cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = "6ab3b545002b36b75001";

/*
 * Crie estes IDs no Appwrite exatamente como abaixo.
 * Eles são usados por todo o portal.
 */
const DATABASE_ID = "traders_elite";

const PROFILES_COLLECTION_ID = "profiles";
const COURSES_COLLECTION_ID = "courses";
const MODULES_COLLECTION_ID = "modules";
const LESSONS_COLLECTION_ID = "lessons";
const ENROLLMENTS_COLLECTION_ID = "enrollments";
const PROGRESS_COLLECTION_ID = "progress";
const CERTIFICATE_REQUESTS_COLLECTION_ID = "certificate_requests";

const MATERIALS_COLLECTION_ID = "materials";
const EVENTS_COLLECTION_ID = "events";
const INSIGHTS_COLLECTION_ID = "insights";
const INSCRIPTIONS_COLLECTION_ID = "inscriptions";

const client = new Appwrite.Client();

client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

const account = new Appwrite.Account(client);
const databases = new Appwrite.Databases(client);

async function testarAppwrite() {
    try {
        await client.ping();
        console.log("✅ Appwrite conectado!");
    } catch (error) {
        console.error("❌ Erro ao conectar ao Appwrite:", error);
    }
}

testarAppwrite();
