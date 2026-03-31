const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 0);

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/teacher',     require('./routes/teacher'));
app.use('/api/admin',       require('./routes/admin'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/students',    require('./routes/students'));
app.use('/api/ai',          require('./routes/ai'));

app.get('/', (req, res) => {
  res.send('ShikshaTrack API is running. Please access the application through the frontend URL.');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
	console.error('JWT_SECRET is not set. Check server/.env');
	process.exit(1);
}

function looksLikeNodeDnsIssue(err) {
	const text = String(err && (err.stack || err.message || err));
	return /\bquerySrv\b|\bqueryA\b|\bqueryAaaa\b/i.test(text) && /ECONNREFUSED|ENOTFOUND|ETIMEOUT/i.test(text);
}

function buildMongoFallbackUriFromEnv() {
	const baseUri = process.env.MONGO_URI;
	const hosts = process.env.MONGO_HOSTS;
	if (!baseUri || !hosts) return null;
	if (!baseUri.startsWith('mongodb+srv://')) return null;

	// Parse: mongodb+srv://<user>:<pass>@<clusterHost>/<db>?<query>
	const withoutScheme = baseUri.slice('mongodb+srv://'.length);
	const atIndex = withoutScheme.lastIndexOf('@');
	if (atIndex === -1) return null;

	const credentialPart = withoutScheme.slice(0, atIndex);
	const afterAt = withoutScheme.slice(atIndex + 1);
	const slashIndex = afterAt.indexOf('/');
	const pathAndQuery = slashIndex === -1 ? '' : afterAt.slice(slashIndex + 1);

	const questionIndex = pathAndQuery.indexOf('?');
	const dbFromPath = (questionIndex === -1 ? pathAndQuery : pathAndQuery.slice(0, questionIndex)).trim();
	const rawQuery = questionIndex === -1 ? '' : pathAndQuery.slice(questionIndex + 1);

	const dbName = (process.env.MONGO_DBNAME || dbFromPath || 'test').trim();
	const params = new URLSearchParams(rawQuery);

	if (!params.has('retryWrites')) params.set('retryWrites', 'true');
	if (!params.has('w')) params.set('w', 'majority');
	if (!params.has('authSource') && process.env.MONGO_AUTH_SOURCE) {
		params.set('authSource', process.env.MONGO_AUTH_SOURCE);
	}
	if (!params.has('replicaSet') && process.env.MONGO_REPLICA_SET) {
		params.set('replicaSet', process.env.MONGO_REPLICA_SET);
	}

	const tlsEnabled = (process.env.MONGO_TLS || 'true').toLowerCase();
	if (!params.has('tls')) params.set('tls', tlsEnabled === 'false' ? 'false' : 'true');

	const queryString = params.toString();
	return `mongodb://${credentialPart}@${hosts}/${dbName}${queryString ? `?${queryString}` : ''}`;
}

async function connectToMongo() {
	if (!process.env.MONGO_URI) {
		throw new Error('MONGO_URI is not set');
	}

	mongoose.connection.on('connected', () => console.log('MongoDB connection event: connected'));
	mongoose.connection.on('disconnected', () => console.warn('MongoDB connection event: disconnected'));
	mongoose.connection.on('error', (e) => console.error('MongoDB connection event: error', e));

	const options = {
		serverSelectionTimeoutMS: 15000,
		bufferCommands: false,
		bufferTimeoutMS: 0,
	};

	try {
		await mongoose.connect(process.env.MONGO_URI, options);
		console.log('MongoDB connected');
		return;
	} catch (err) {
		const fallbackUri = process.env.MONGO_URI_FALLBACK || buildMongoFallbackUriFromEnv();
		if (looksLikeNodeDnsIssue(err) && fallbackUri) {
			console.warn('MongoDB SRV/DNS resolution failed; retrying with non-SRV URI...');
			await mongoose.connect(fallbackUri, options);
			console.log('MongoDB connected (fallback)');
			return;
		}

		console.error('DB connection failed:', err);
		throw err;
	}
}

async function start() {
	await connectToMongo();
	app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch((err) => {
	console.error('Startup failed:', err);
	process.exit(1);
});
