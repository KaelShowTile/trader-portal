export const generateAdminLoginHtml = (clientId: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body class="bg-gray-50 flex items-center justify-center h-screen">
    <div class="bg-white p-8 rounded-lg shadow-md w-96 flex flex-col items-center">
        <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">ST Trader System - Admin</h2>
        
        <div id="g_id_onload"
            data-client_id="${clientId}"
            data-callback="handleCredentialResponse"
            data-auto_prompt="false">
        </div>
        <div class="g_id_signin"
            data-type="standard"
            data-size="large"
            data-theme="outline"
            data-text="sign_in_with"
            data-shape="rectangular"
            data-logo_alignment="left">
        </div>
        <div id="error-message" class="text-red-500 text-sm hidden mt-4 text-center"></div>
    </div>

    <script>
        async function handleCredentialResponse(response) {
            try {
                const res = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ credential: response.credential })
                });
                
                const data = await res.json();
                if (data.success) {
                    window.location.href = '/admin/dashboard';
                } else {
                    document.getElementById('error-message').textContent = data.message || 'Login failed';
                    document.getElementById('error-message').classList.remove('hidden');
                }
            } catch (err) {
                document.getElementById('error-message').textContent = 'An error occurred';
                document.getElementById('error-message').classList.remove('hidden');
            }
        }
    </script>
</body>
</html>
`;

export const generateAdminDashboardHtml = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; z-index: 50; }
        .modal.active { display: flex; }
        /* Make content fill screen height nicely */
        .h-main { height: calc(100vh - 4rem - 3rem); } 
    </style>
</head>
<body class="bg-gray-100 min-h-screen font-sans flex flex-col">
    <nav class="bg-gray-800 text-white flex-shrink-0">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center space-x-4">
                    <span class="font-bold text-xl">ST Trader System - Admin</span>
                    <button onclick="switchTab('dealers')" id="tab-dealers" class="px-3 py-2 rounded-md text-sm font-medium bg-gray-900 tab-btn">Dealers</button>
                    <button onclick="switchTab('schemas')" id="tab-schemas" class="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 tab-btn">Price Schemas</button>
                </div>
                <div>
                    <button onclick="logout()" class="px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 bg-red-600">Logout</button>
                </div>
            </div>
        </div>
    </nav>

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 w-full flex-1 flex flex-col h-main">
        
        <!-- Dealers Tab -->
        <div id="view-dealers" class="tab-content flex-1 flex space-x-4 min-h-0">
            <!-- Left Column: Dealers List -->
            <div class="w-1/4 bg-white shadow rounded-md flex flex-col h-full">
                <div class="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-md">
                    <h2 class="text-lg font-bold">Dealers</h2>
                    <button onclick="openModal('dealerModal')" class="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700">Add</button>
                </div>
                <div class="overflow-y-auto flex-1">
                    <ul id="dealers-list" class="divide-y divide-gray-200">
                        <!-- Populated via JS -->
                    </ul>
                </div>
            </div>

            <!-- Right Column: Dealer Details & Overrides -->
            <div class="w-3/4 bg-white shadow rounded-md flex flex-col h-full hidden" id="dealer-details-container">
                <!-- Basic Info -->
                <div class="p-4 border-b bg-gray-50 rounded-t-md flex-shrink-0 flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex justify-between items-start">
                            <div>
                                <h2 class="text-lg font-bold mb-4 text-gray-800" id="current-dealer-name">Dealer Name</h2>
                            </div>
                            <div>
                                <button onclick="deleteCurrentDealer()" class="text-red-600 border border-red-600 px-3 py-1 rounded hover:bg-red-50 text-sm">Delete Dealer</button>
                                <button onclick="saveDealerInfo()" class="bg-blue-600 text-white px-4 py-1.5 rounded shadow hover:bg-blue-700 text-sm font-semibold">Save Info</button>
                            </div>
                        </div>
                        <input type="hidden" id="current-dealer-id">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-medium text-gray-700">Username</label>
                                <input id="edit_d_username" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 sm:text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-700">Company Name</label>
                                <input id="edit_d_company" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 sm:text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-700">Email</label>
                                <input id="edit_d_email" type="email" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 sm:text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-700">Phone</label>
                                <input id="edit_d_phone" type="text" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 sm:text-sm">
                            </div>
                            <div class="col-span-2">
                                <label class="block text-xs font-medium text-gray-700">Assigned Price Schema</label>
                                <select id="edit_d_schema" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 sm:text-sm">
                                    <option value="">None</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Overrides -->
                <div class="p-4 border-b flex justify-between items-center bg-white flex-shrink-0">
                    <h3 class="text-md font-bold text-gray-700">Override Prices</h3>
                    <button onclick="saveOverrides()" class="bg-green-600 text-white px-4 py-1.5 rounded shadow hover:bg-green-700 text-sm font-semibold">Save Overrides</button>
                </div>
                <div class="overflow-y-auto flex-1 relative">
                    <table class="w-full text-left table-fixed">
                        <thead class="bg-gray-100 sticky top-0 z-10 shadow-sm">
                            <tr class="border-b">
                                <th class="p-3 w-20 text-center">Active</th>
                                <th class="p-3">Product Name</th>
                                <th class="p-3 w-32 text-gray-500 font-normal text-sm">Schema Price</th>
                                <th class="p-3 w-40 text-blue-600 font-normal">Override Price</th>
                            </tr>
                        </thead>
                        <tbody id="dealer-overrides-list" class="divide-y divide-gray-100">
                            <!-- Populated via JS -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Schemas Tab -->
        <div id="view-schemas" class="tab-content hidden flex-1 flex space-x-4 min-h-0">
            <!-- Left Column: Schemas List -->
            <div class="w-1/4 bg-white shadow rounded-md flex flex-col h-full">
                <div class="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-md">
                    <h2 class="text-lg font-bold">Price Schemas</h2>
                    <button onclick="openModal('schemaModal')" class="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700">Add</button>
                </div>
                <div class="overflow-y-auto flex-1">
                    <ul id="schemas-list" class="divide-y divide-gray-200">
                        <!-- Populated via JS -->
                    </ul>
                </div>
            </div>

            <!-- Right Column: Products & Prices -->
            <div class="w-3/4 bg-white shadow rounded-md flex flex-col h-full hidden" id="schema-details-container">
                <div class="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-md flex-shrink-0">
                    <div>
                        <h2 class="text-lg font-bold" id="current-schema-name">Select a schema</h2>
                        <input type="hidden" id="current-schema-id">
                    </div>
                    <div class="space-x-2">
                        <button onclick="deleteCurrentSchema()" class="text-red-600 border border-red-600 px-3 py-1 rounded hover:bg-red-50 text-sm">Delete Schema</button>
                        <button onclick="saveSchemaItems()" class="bg-green-600 text-white px-4 py-1.5 rounded shadow hover:bg-green-700 font-semibold">Save Prices</button>
                    </div>
                </div>
                <div class="overflow-y-auto flex-1 relative">
                    <table class="w-full text-left table-fixed">
                        <thead class="bg-gray-100 sticky top-0 z-10 shadow-sm">
                            <tr class="border-b">
                                <th class="p-3 w-20 text-center">Active</th>
                                <th class="p-3">Product Name</th>
                                <th class="p-3 w-48 text-gray-500 font-normal text-sm">CHT Product ID</th>
                                <th class="p-3 w-40 text-green-700 font-normal">Price</th>
                            </tr>
                        </thead>
                        <tbody id="schema-products-list" class="divide-y divide-gray-100">
                            <!-- Populated via JS -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

    </main>

    <!-- Dealer Modal (For Creation Only) -->
    <div id="dealerModal" class="modal">
        <div class="bg-white p-6 rounded-lg w-96">
            <h3 class="text-lg font-bold mb-4">Add New Dealer</h3>
            <div class="space-y-4">
                <input id="d_username" placeholder="Username" class="w-full border p-2 rounded">
                <input id="d_company" placeholder="Company Name" class="w-full border p-2 rounded">
                <input id="d_email" type="email" placeholder="Email" class="w-full border p-2 rounded">
                <input id="d_phone" type="text" placeholder="Phone" class="w-full border p-2 rounded">
                <div class="flex justify-end space-x-2">
                    <button onclick="closeModal('dealerModal')" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                    <button onclick="createDealer()" class="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Schema Modal -->
    <div id="schemaModal" class="modal">
        <div class="bg-white p-6 rounded-lg w-96">
            <h3 class="text-lg font-bold mb-4">Create Schema</h3>
            <div class="space-y-4">
                <input id="s_name" placeholder="Schema Name" class="w-full border p-2 rounded">
                <div class="flex justify-end space-x-2">
                    <button onclick="closeModal('schemaModal')" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                    <button onclick="createSchema()" class="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        let allSchemas = [];
        let allDealers = [];
        let allProducts = [];

        async function init() {
            // Fetch schemas and products once to cache
            const [schemaData, prodData] = await Promise.all([
                apiCall('/api/admin/schemas'),
                apiCall('/api/admin/products')
            ]);
            allSchemas = schemaData.schemas || [];
            allProducts = prodData.products || [];
            
            // Populate schema dropdown in dealer details
            const select = document.getElementById('edit_d_schema');
            select.innerHTML = '<option value="">None</option>';
            allSchemas.forEach(s => select.innerHTML += \`<option value="\${s.schema_id}">\${s.schema_name}</option>\`);

            loadDealers();
        }

        function switchTab(tab) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('bg-gray-900'));
            
            document.getElementById('view-' + tab).classList.remove('hidden');
            document.getElementById('tab-' + tab).classList.add('bg-gray-900');

            if(tab === 'dealers') loadDealers();
            if(tab === 'schemas') loadSchemas();
        }

        async function logout() {
            await fetch('/api/admin/logout', { method: 'POST' });
            window.location.href = '/admin/login';
        }

        function openModal(id) { document.getElementById(id).classList.add('active'); }
        function closeModal(id) { document.getElementById(id).classList.remove('active'); }

        async function apiCall(url, method = 'GET', body = null) {
            const options = { method };
            if (body) { options.headers = { 'Content-Type': 'application/json' }; options.body = JSON.stringify(body); }
            const res = await fetch(url, options);
            if (res.status === 401) return window.location.href = '/admin/login';
            
            const data = await res.json();
            if (!res.ok || (data && data.success === false)) {
                alert('Error: ' + (data.message || 'Unknown error occurred'));
                throw new Error(data.message || 'API Error');
            }
            return data;
        }

        // --- Dealers ---
        async function loadDealers() {
            const data = await apiCall('/api/admin/dealers');
            allDealers = data.dealers || [];
            const ul = document.getElementById('dealers-list');
            ul.innerHTML = '';
            
            if (allDealers.length === 0) {
                ul.innerHTML = '<li class="p-4 text-gray-500 text-sm text-center">No dealers found.</li>';
                document.getElementById('dealer-details-container').classList.add('hidden');
            } else {
                allDealers.forEach(d => {
                    const displayName = d.company_name || d.username;
                    ul.innerHTML += \`
                    <li class="cursor-pointer hover:bg-blue-50 border-b group" onclick="selectDealer(\${d.dealer_id})">
                        <div class="px-4 py-3 flex items-center justify-between">
                            <span class="font-medium text-gray-800 group-hover:text-blue-700">\${displayName}</span>
                        </div>
                    </li>\`;
                });
            }
        }

        async function createDealer() {
            const username = document.getElementById('d_username').value;
            const company_name = document.getElementById('d_company').value;
            const email = document.getElementById('d_email').value;
            const phone = document.getElementById('d_phone').value;
            await apiCall('/api/admin/dealers', 'POST', { username, company_name, email, phone });
            closeModal('dealerModal');
            loadDealers();
        }

        async function deleteCurrentDealer() {
            const id = document.getElementById('current-dealer-id').value;
            if(!id) return;
            if(confirm('Delete dealer?')) {
                await apiCall('/api/admin/dealers/' + id, 'DELETE');
                document.getElementById('dealer-details-container').classList.add('hidden');
                loadDealers();
            }
        }

        async function selectDealer(dealerId) {
            document.getElementById('dealer-details-container').classList.remove('hidden');
            
            const dealer = allDealers.find(d => d.dealer_id === dealerId);
            if (!dealer) return;

            // Fill Basic Info
            document.getElementById('current-dealer-name').innerText = dealer.company_name || dealer.username;
            document.getElementById('current-dealer-id').value = dealer.dealer_id;
            document.getElementById('edit_d_username').value = dealer.username || '';
            document.getElementById('edit_d_company').value = dealer.company_name || '';
            document.getElementById('edit_d_email').value = dealer.email || '';
            document.getElementById('edit_d_phone').value = dealer.phone || '';
            document.getElementById('edit_d_schema').value = dealer.price_schema_id || '';

            // Load Overrides and Schema Reference Prices
            const tbody = document.getElementById('dealer-overrides-list');
            tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-500">Loading products...</td></tr>';

            let schemaPriceMap = {};
            if (dealer.price_schema_id) {
                const schemaData = await apiCall('/api/admin/schemas/' + dealer.price_schema_id + '/items');
                (schemaData.items || []).forEach(i => schemaPriceMap[i.cht_product_id] = i.schema_price);
            }

            const overrideData = await apiCall('/api/admin/overrides/' + dealerId);
            let overrideMap = {};
            (overrideData.overrides || []).forEach(o => overrideMap[o.cht_product_id] = o.override_price);

            tbody.innerHTML = '';
            
            if (allProducts.length === 0) {
                 tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-500">No products found.</td></tr>';
                 return;
            }

            allProducts.forEach(p => {
                const schemaPrice = schemaPriceMap[p.cht_product_id] !== undefined ? '$' + schemaPriceMap[p.cht_product_id] : '-';
                const currentOverride = overrideMap[p.cht_product_id];
                // Checkbox is default checked
                
                tbody.innerHTML += \`
                <tr class="hover:bg-gray-50">
                    <td class="p-3 text-center">
                        <input type="checkbox" class="dealer-override-cb w-4 h-4 text-blue-600 rounded" data-pid="\${p.cht_product_id}" checked>
                    </td>
                    <td class="p-3 font-medium text-gray-800 text-sm">\${p.cht_product_name || p.cht_product_id}</td>
                    <td class="p-3 text-sm text-gray-500">\${schemaPrice}</td>
                    <td class="p-3">
                        <div class="relative rounded-md shadow-sm">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span class="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input type="number" step="0.01" class="dealer-override-price focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md border p-1" data-pid="\${p.cht_product_id}" value="\${currentOverride !== undefined ? currentOverride : ''}" placeholder="0.00">
                        </div>
                    </td>
                </tr>\`;
            });
        }

        async function saveDealerInfo() {
            const id = document.getElementById('current-dealer-id').value;
            if(!id) return;

            const username = document.getElementById('edit_d_username').value;
            const company_name = document.getElementById('edit_d_company').value;
            const email = document.getElementById('edit_d_email').value;
            const phone = document.getElementById('edit_d_phone').value;
            const schema_id = document.getElementById('edit_d_schema').value;

            await apiCall('/api/admin/dealers/' + id, 'PUT', { 
                username, company_name, email, phone, 
                price_schema_id: schema_id ? parseInt(schema_id) : null 
            });
            alert('Dealer info saved successfully!');
            // Reload dealer list and re-select to refresh schema prices if changed
            await loadDealers();
            selectDealer(parseInt(id));
        }

        async function saveOverrides() {
            const dealerId = document.getElementById('current-dealer-id').value;
            if(!dealerId) return;

            const items = [];
            const checkboxes = document.querySelectorAll('.dealer-override-cb');
            checkboxes.forEach(cb => {
                if (cb.checked) {
                    const pid = cb.getAttribute('data-pid');
                    const priceInput = document.querySelector(\`.dealer-override-price[data-pid="\${pid}"]\`);
                    const price = parseFloat(priceInput.value);
                    
                    if (!isNaN(price)) {
                        items.push({ cht_product_id: pid, override_price: price });
                    }
                }
            });

            await apiCall('/api/admin/overrides/' + dealerId + '/bulk', 'POST', { items });
            alert('Overrides saved successfully!');
        }


        // --- Schemas & Schema Items ---
        async function loadSchemas() {
            // Re-fetch schemas to get latest list
            const data = await apiCall('/api/admin/schemas');
            allSchemas = data.schemas || [];
            
            const ul = document.getElementById('schemas-list');
            ul.innerHTML = '';
            
            if (allSchemas.length === 0) {
                ul.innerHTML = '<li class="p-4 text-gray-500 text-sm text-center">No schemas found.</li>';
                document.getElementById('schema-details-container').classList.add('hidden');
            } else {
                allSchemas.forEach(s => {
                    ul.innerHTML += \`
                    <li class="cursor-pointer hover:bg-blue-50 border-b group" onclick="selectSchema(\${s.schema_id}, '\${s.schema_name}')">
                        <div class="px-4 py-3 flex items-center justify-between">
                            <span class="font-medium text-gray-800 group-hover:text-blue-700">\${s.schema_name}</span>
                            <span class="text-xs text-gray-400">ID: \${s.schema_id}</span>
                        </div>
                    </li>\`;
                });
            }
        }

        async function createSchema() {
            const name = document.getElementById('s_name').value;
            if (!name) return alert('Please enter a name');
            await apiCall('/api/admin/schemas', 'POST', { schema_name: name });
            closeModal('schemaModal');
            
            // Refresh dropdown in dealer info too
            const schemaData = await apiCall('/api/admin/schemas');
            allSchemas = schemaData.schemas || [];
            const select = document.getElementById('edit_d_schema');
            const currentVal = select.value;
            select.innerHTML = '<option value="">None</option>';
            allSchemas.forEach(s => select.innerHTML += \`<option value="\${s.schema_id}">\${s.schema_name}</option>\`);
            select.value = currentVal;
            
            loadSchemas();
        }

        async function deleteCurrentSchema() {
            const id = document.getElementById('current-schema-id').value;
            if(!id) return;
            if(confirm('Delete schema? This might affect dealers.')) {
                await apiCall('/api/admin/schemas/' + id, 'DELETE');
                document.getElementById('schema-details-container').classList.add('hidden');
                loadSchemas();
            }
        }

        async function selectSchema(schemaId, schemaName) {
            document.getElementById('schema-details-container').classList.remove('hidden');
            document.getElementById('current-schema-name').innerText = schemaName;
            document.getElementById('current-schema-id').value = schemaId;

            const tbody = document.getElementById('schema-products-list');
            tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-500">Loading products...</td></tr>';

            const data = await apiCall('/api/admin/schemas/' + schemaId + '/items');
            const items = data.items || [];
            
            const priceMap = {};
            items.forEach(i => {
                priceMap[i.cht_product_id] = i.schema_price;
            });

            tbody.innerHTML = '';
            
            if (allProducts.length === 0) {
                 tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-500">No products found.</td></tr>';
                 return;
            }

            allProducts.forEach(p => {
                const currentPrice = priceMap[p.cht_product_id];
                // Checkbox is default checked
                
                tbody.innerHTML += \`
                <tr class="hover:bg-gray-50">
                    <td class="p-3 text-center">
                        <input type="checkbox" class="schema-product-cb w-4 h-4 text-blue-600 rounded" data-pid="\${p.cht_product_id}" checked>
                    </td>
                    <td class="p-3 font-medium text-gray-800 text-sm">\${p.cht_product_name || 'Unnamed Product'}</td>
                    <td class="p-3 text-sm text-gray-500">\${p.cht_product_id}</td>
                    <td class="p-3">
                        <div class="relative rounded-md shadow-sm">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span class="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input type="number" step="0.01" class="schema-product-price focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md border p-1" data-pid="\${p.cht_product_id}" value="\${currentPrice !== undefined ? currentPrice : ''}" placeholder="0.00">
                        </div>
                    </td>
                </tr>\`;
            });
        }

        async function saveSchemaItems() {
            const schemaId = document.getElementById('current-schema-id').value;
            if(!schemaId) return;

            const items = [];
            const checkboxes = document.querySelectorAll('.schema-product-cb');
            checkboxes.forEach(cb => {
                if (cb.checked) {
                    const pid = cb.getAttribute('data-pid');
                    const priceInput = document.querySelector(\`.schema-product-price[data-pid="\${pid}"]\`);
                    const price = parseFloat(priceInput.value);
                    
                    if (!isNaN(price)) {
                        items.push({ cht_product_id: pid, schema_price: price });
                    }
                }
            });

            await apiCall('/api/admin/schemas/' + schemaId + '/bulk_items', 'POST', { items });
            alert('Prices saved successfully!');
        }

        // Initialize on load
        init();
    </script>
</body>
</html>
`;
