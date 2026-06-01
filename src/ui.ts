export const generateDealerLoginHtml = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dealer Login - Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 flex items-center justify-center h-screen">
    <div class="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">Dealer Portal</h2>
        <form id="loginForm" class="space-y-4">
            <div>
                <label for="company_name" class="block text-sm font-medium text-gray-700">Company Name</label>
                <input type="text" id="company_name" name="company_name" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            </div>
            <div>
                <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
                <input type="email" id="email" name="email" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            </div>
            <div id="error-message" class="text-red-500 text-sm hidden"></div>
            <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Log In
            </button>
        </form>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const company_name = document.getElementById('company_name').value;
            const email = document.getElementById('email').value;
            const errorDiv = document.getElementById('error-message');
            
            errorDiv.classList.add('hidden');
            
            try {
                const res = await fetch('/api/dealer/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ company_name, email })
                });
                
                const data = await res.json();
                if (data.success) {
                    window.location.href = '/dealer/dashboard';
                } else {
                    errorDiv.textContent = data.message || 'Login failed';
                    errorDiv.classList.remove('hidden');
                }
            } catch (err) {
                errorDiv.textContent = 'An error occurred';
                errorDiv.classList.remove('hidden');
            }
        });
    </script>
</body>
</html>
`;

export const generateDealerDashboardHtml = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dealer Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- DataTables CSS -->
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css">
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/responsive/2.5.0/css/responsive.dataTables.min.css">
    <style>
        td.details-control {
            background: url('https://www.datatables.net/examples/resources/details_open.png') no-repeat center center;
            cursor: pointer;
        }
        tr.shown td.details-control {
            background: url('https://www.datatables.net/examples/resources/details_close.png') no-repeat center center;
        }
        table.dataTable.display tbody tr:hover{background: #efefef;}
        table.dataTable.display tbody tr td{box-shadow: none !important;}
        .variants-table { width: 100%; border-collapse: collapse; margin: auto 10px; }
        .variants-table th, .variants-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .variants-table th { background-color: #f2f2f2; }

    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <img src="https://showtile.com.au/wp-content/uploads/2026/02/st-logo-svg.svg" alt="logo" class="logo" height="50">
                </div>
                <div class="flex items-center">
                    <button id="logoutBtn" class="text-gray-600 hover:text-gray-900">LOGOUT</button>
                </div>
            </div>
        </div>
    </nav>

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="bg-white px-4 py-5 border-b border-gray-200 sm:px-6 rounded-t-lg shadow">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Welcome to ST Trader Portal</h3>
        </div>
        <div class="bg-white p-8 shadow rounded-b-lg">
            <table id="productsTable" class="display responsive nowrap w-full" style="width:100%; padding-top: 10px;">
                <thead>
                    <tr>
                        <th></th>
                        <th>Product ID</th>
                        <th>Product Name</th>
                        <th>Your Price</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Populated by JS -->
                </tbody>
            </table>
        </div>
    </main>

    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
    <!-- DataTables JS -->
    <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/responsive/2.5.0/js/dataTables.responsive.min.js"></script>

    <script>
        $(document).ready(function() {
            // Fetch product data
            let table = $('#productsTable').DataTable({
                ajax: {
                    url: '/api/dealer/products',
                    dataSrc: 'data'
                },
                columns: [
                    {
                        className: 'details-control',
                        orderable: false,
                        data: null,
                        defaultContent: ''
                    },
                    { data: 'cht_product_id' },
                    { data: 'cht_product_name' },
                    { 
                        data: 'final_price',
                        render: $.fn.dataTable.render.number(',', '.', 2, '$')
                    }
                ],
                order: [[1, 'asc']]
            });

            // Add event listener for opening and closing details
            $('#productsTable tbody').on('click', 'td.details-control', function () {
                var tr = $(this).closest('tr');
                tr.addClass('product-parent-row');
                var row = table.row(tr);

                if (row.child.isShown()) {
                    // This row is already open - close it
                    row.child.hide();
                    tr.removeClass('shown');    
                } else {
                    // Open this row
                    row.child(format(row.data())).show();
                    tr.addClass('shown');
                }
            });

            // Details formatting function
            function format(d) {
                let variants = [];
                try {
                    variants = JSON.parse(d.variants);
                } catch(e) {
                    console.error("Error parsing variants", e);
                }

                let variantsHtml = '<table class="variants-table"><thead><tr><th>SKU</th><th>Stock</th></tr></thead><tbody>';
                variants.forEach(v => {
                    variantsHtml += '<tr><td>' + v.sku + '</td><td>' + v.stock + '</td></tr>';
                });
                variantsHtml += '</tbody></table>';
                
                return variantsHtml;
            }

            $('#logoutBtn').click(async () => {
                await fetch('/api/dealer/logout', { method: 'POST' });
                window.location.href = '/dealer/login';
            });
        });
    </script>
</body>
</html>
`;
