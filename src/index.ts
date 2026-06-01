import { Hono } from 'hono';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { generateDealerLoginHtml, generateDealerDashboardHtml } from './ui';
import { generateAdminLoginHtml, generateAdminDashboardHtml } from './adminUi';

export type Env = {
	tile_db: D1Database;
	SESSION_SECRET: string;
	GOOGLE_CLIENT_ID: string;
	ALLOWED_EMAILS: string;
	COOKIE_SECRET: string;
};

const app = new Hono<{ Bindings: Env }>();

app.onError((err, c) => {
	console.error('Unhandled Exception:', err);
	return c.json({ success: false, message: err.message || 'Internal Server Error' }, 500);
});

// --- UI Routes ---

app.get('/', (c) => c.redirect('/dealer/login'));

app.get('/dealer/login', (c) => {
	return c.html(generateDealerLoginHtml());
});

app.get('/dealer/dashboard', async (c) => {
	const dealerId = getCookie(c, 'dealer_id');
	if (!dealerId) {
		return c.redirect('/dealer/login');
	}
	return c.html(generateDealerDashboardHtml());
});

// Admin UI Routes
app.get('/admin', (c) => c.redirect('/admin/dashboard'));

app.get('/admin/login', (c) => {
	return c.html(generateAdminLoginHtml(c.env.GOOGLE_CLIENT_ID));
});

app.get('/admin/dashboard', async (c) => {
	const adminSession = getCookie(c, 'admin_session');
	if (!adminSession) {
		return c.redirect('/admin/login');
	}
	// Simplified auth check - in production verify JWT/Session
	return c.html(generateAdminDashboardHtml());
});

// --- API Routes (Admin) ---

// Verify Google Token (Implicit GIS flow)
app.post('/api/admin/login', async (c) => {
	const body = await c.req.json();
	const { credential } = body;

	if (!credential) return c.json({ success: false, message: 'No credential provided' }, 400);

	try {
		// Verify Google ID Token via Google API
		const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
		if (!verifyRes.ok) throw new Error("Invalid token");

		const payload: any = await verifyRes.json();
		
		// Check Client ID
		if (payload.aud !== c.env.GOOGLE_CLIENT_ID) {
			return c.json({ success: false, message: 'Invalid Client ID' }, 401);
		}

		// Check Allowed Emails
		const allowedEmails = c.env.ALLOWED_EMAILS.split(',').map(e => e.trim());
		if (!allowedEmails.includes(payload.email)) {
			return c.json({ success: false, message: 'Unauthorized email address' }, 403);
		}

		// Set Admin Session
		setCookie(c, 'admin_session', payload.email, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'Strict',
			maxAge: 60 * 60 * 24 // 24 hours
		});

		return c.json({ success: true, email: payload.email });
	} catch (error) {
		return c.json({ success: false, message: 'Login verification failed' }, 401);
	}
});

app.post('/api/admin/logout', (c) => {
	deleteCookie(c, 'admin_session');
	return c.json({ success: true });
});

// Middleware for Admin APIs
app.use('/api/admin/*', async (c, next) => {
	if (c.req.path === '/api/admin/login' || c.req.path === '/api/admin/logout') {
		return next();
	}
	const session = getCookie(c, 'admin_session');
	if (!session) return c.json({ success: false, message: 'Unauthorized' }, 401);
	await next();
});

app.get('/api/admin/dealers', async (c) => {
	const db = c.env.tile_db;
	const dealers = await db.prepare('SELECT dealer_id, username, company_name, email, phone, price_schema_id FROM dealers ORDER BY dealer_id DESC').all();
	return c.json({ success: true, dealers: dealers.results });
});

app.post('/api/admin/dealers', async (c) => {
	const db = c.env.tile_db;
	const body = await c.req.json();
	const { username, company_name, email, phone } = body;
	try {
		await db.prepare('INSERT INTO dealers (username, password_hash, company_name, email, phone) VALUES (?, ?, ?, ?, ?)')
				.bind(username, 'dummy_hash', company_name, email, phone || null).run();
		return c.json({ success: true });
	} catch (e: any) {
		return c.json({ success: false, message: e.message }, 500);
	}
});

app.put('/api/admin/dealers/:id', async (c) => {
	const db = c.env.tile_db;
	const { username, company_name, email, phone, price_schema_id } = await c.req.json();
	try {
		await db.prepare('UPDATE dealers SET username = ?, company_name = ?, email = ?, phone = ?, price_schema_id = ? WHERE dealer_id = ?')
				.bind(username, company_name, email, phone || null, price_schema_id || null, c.req.param('id')).run();
		return c.json({ success: true });
	} catch (e: any) {
		return c.json({ success: false, message: e.message }, 500);
	}
});

app.delete('/api/admin/dealers/:id', async (c) => {
	const db = c.env.tile_db;
	await db.prepare('DELETE FROM dealers WHERE dealer_id = ?').bind(c.req.param('id')).run();
	return c.json({ success: true });
});

app.get('/api/admin/schemas', async (c) => {
	const db = c.env.tile_db;
	const schemas = await db.prepare('SELECT * FROM price_schemas ORDER BY schema_id DESC').all();
	return c.json({ success: true, schemas: schemas.results });
});

app.get('/api/admin/products', async (c) => {
	const db = c.env.tile_db;
	const products = await db.prepare("SELECT cht_product_id, MAX(cht_product_name) as cht_product_name, MAX(rrp) as rrp FROM products WHERE cht_product_id IS NOT NULL AND cht_product_name IS NOT NULL AND trim(cht_product_name) != '' GROUP BY cht_product_id ORDER BY cht_product_name ASC").all();
	return c.json({ success: true, products: products.results });
});

app.post('/api/admin/schemas', async (c) => {
	const db = c.env.tile_db;
	const { schema_name } = await c.req.json();
	try {
		await db.prepare('INSERT INTO price_schemas (schema_name) VALUES (?)').bind(schema_name).run();
		return c.json({ success: true });
	} catch (e: any) {
		return c.json({ success: false, message: e.message }, 500);
	}
});

app.delete('/api/admin/schemas/:id', async (c) => {
	const db = c.env.tile_db;
	await db.prepare('DELETE FROM price_schemas WHERE schema_id = ?').bind(c.req.param('id')).run();
	return c.json({ success: true });
});

// Schema Items
app.get('/api/admin/schemas/:id/items', async (c) => {
	const db = c.env.tile_db;
	const items = await db.prepare('SELECT * FROM price_schema_items WHERE schema_id = ?').bind(c.req.param('id')).all();
	return c.json({ success: true, items: items.results });
});

app.post('/api/admin/schemas/:id/bulk_items', async (c) => {
	const db = c.env.tile_db;
	const schema_id = c.req.param('id');
	const { items } = await c.req.json(); // items is an array of { cht_product_id, schema_price }
	
	try {
		// Start a transaction if possible, or just delete and insert
		await db.prepare('DELETE FROM price_schema_items WHERE schema_id = ?').bind(schema_id).run();
		
		if (items && items.length > 0) {
			// Construct a batch insert
			const stmts = items.map((item: any) => {
				return db.prepare('INSERT INTO price_schema_items (schema_id, cht_product_id, schema_price) VALUES (?, ?, ?)')
						 .bind(schema_id, item.cht_product_id, item.schema_price);
			});
			await db.batch(stmts);
		}
		
		return c.json({ success: true });
	} catch (e: any) {
		return c.json({ success: false, message: e.message }, 500);
	}
});

app.post('/api/admin/schemas/:id/items', async (c) => {
	const db = c.env.tile_db;
	const schema_id = c.req.param('id');
	const { cht_product_id, schema_price } = await c.req.json();
	try {
		// Use REPLACE or INSERT...ON CONFLICT to update if exists
		await db.prepare(`
			INSERT INTO price_schema_items (schema_id, cht_product_id, schema_price) 
			VALUES (?, ?, ?) 
			ON CONFLICT(schema_id, cht_product_id) DO UPDATE SET schema_price = excluded.schema_price
		`).bind(schema_id, cht_product_id, schema_price).run();
		return c.json({ success: true });
	} catch (e: any) {
		return c.json({ success: false, message: e.message }, 500);
	}
});

app.delete('/api/admin/schemas/:id/items/:item_id', async (c) => {
	const db = c.env.tile_db;
	await db.prepare('DELETE FROM price_schema_items WHERE item_id = ?').bind(c.req.param('item_id')).run();
	return c.json({ success: true });
});

// Overrides
app.get('/api/admin/overrides/:dealer_id', async (c) => {
	const db = c.env.tile_db;
	const overrides = await db.prepare('SELECT * FROM dealer_overrides WHERE dealer_id = ?').bind(c.req.param('dealer_id')).all();
	return c.json({ success: true, overrides: overrides.results });
});

app.post('/api/admin/overrides/:dealer_id/bulk', async (c) => {
	const db = c.env.tile_db;
	const dealer_id = c.req.param('dealer_id');
	const { items } = await c.req.json(); // items is an array of { cht_product_id, override_price }
	
	try {
		await db.prepare('DELETE FROM dealer_overrides WHERE dealer_id = ?').bind(dealer_id).run();
		
		if (items && items.length > 0) {
			const stmts = items.map((item: any) => {
				return db.prepare('INSERT INTO dealer_overrides (dealer_id, cht_product_id, override_price) VALUES (?, ?, ?)')
						 .bind(dealer_id, item.cht_product_id, item.override_price);
			});
			await db.batch(stmts);
		}
		
		return c.json({ success: true });
	} catch (e: any) {
		return c.json({ success: false, message: e.message }, 500);
	}
});

// --- API Routes (Dealer) ---

app.post('/api/dealer/login', async (c) => {
	const body = await c.req.json();
	const { company_name, email } = body;

	if (!company_name || !email) {
		return c.json({ success: false, message: 'Company name and email are required.' }, 400);
	}

	const db = c.env.tile_db;

	// Authenticate dealer
	const query = `SELECT dealer_id FROM dealers WHERE company_name = ? AND email = ?`;
	const result = await db.prepare(query).bind(company_name, email).first<{ dealer_id: number }>();

	if (result) {
		setCookie(c, 'dealer_id', result.dealer_id.toString(), {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'Strict',
			maxAge: 60 * 60 * 24 // 24 hours
		});
		return c.json({ success: true });
	} else {
		return c.json({ success: false, message: 'Invalid credentials.' }, 401);
	}
});

app.post('/api/dealer/logout', (c) => {
	deleteCookie(c, 'dealer_id');
	return c.json({ success: true });
});

app.get('/api/dealer/products', async (c) => {
	const dealerId = getCookie(c, 'dealer_id');
	if (!dealerId) {
		return c.json({ success: false, message: 'Unauthorized' }, 401);
	}

	const db = c.env.tile_db;

	const sql = `
		SELECT 
			p.cht_product_id, 
			p.cht_product_name,
			COALESCE(do.override_price, psi.schema_price) as final_price,
			JSON_GROUP_ARRAY(
				JSON_OBJECT('sku', p.sku, 'stock', p.stock)
			) as variants
		FROM products p
		LEFT JOIN dealers d ON d.dealer_id = ?
		LEFT JOIN dealer_overrides do ON do.dealer_id = d.dealer_id AND do.cht_product_id = p.cht_product_id
		LEFT JOIN price_schema_items psi ON psi.schema_id = d.price_schema_id AND psi.cht_product_id = p.cht_product_id
		WHERE COALESCE(do.override_price, psi.schema_price) IS NOT NULL
		GROUP BY p.cht_product_id, p.cht_product_name
	`;

	try {
		const result = await db.prepare(sql).bind(dealerId).all();
		return c.json({ success: true, data: result.results });
	} catch (error: any) {
		console.error("DB Error:", error.message);
		return c.json({ success: false, message: 'Database error' }, 500);
	}
});

export default app;
