const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env' });

async function resetAdminKey() {
    const uri = process.env.MONGO_URL;
    const dbName = process.env.DB_NAME;
    const newKey = process.env.ADMIN_KEY;

    if (!uri || !dbName || !newKey) {
        console.error('Missing env vars:', { uri: !!uri, dbName: !!dbName, newKey: !!newKey });
        process.exit(1);
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const result = await db.collection('settings').updateOne(
            { id: 'admin_auth' },
            { $set: { password: newKey, updated_at: new Date().toISOString() } },
            { upsert: true }
        );
        console.log('Admin key reset result:', result);
    } catch (e) {
        console.error('Error resetting key:', e);
    } finally {
        await client.close();
    }
}

resetAdminKey();
