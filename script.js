// Variables Globales
let products = [];
let cart = JSON.parse(localStorage.getItem('shopmaster_cart')) || [];

// 1. Cargar productos de la API
async function fetchProducts() {
    try {
        const response = await fetch('https://fakestoreapi.com/products');
        products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error("Error cargando productos:", error);
    }
}

// 2. Mostrar productos en el DOM
function renderProducts(items) {
    const container = document.getElementById('product-container');
    container.innerHTML = '';

    items.forEach(product => {
        container.innerHTML += `
            <div class="col">
                <div class="card h-100 shadow-sm">
                    <img src="${product.image}" class="card-img-top product-img" alt="${product.title}">
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title fw-bold">${product.title.substring(0, 40)}...</h6>
                        <p class="badge-price mt-auto">$${product.price.toFixed(2)}</p>
                        <button class="btn btn-outline-primary w-100" onclick="showDetail(${product.id})">Ver más</button>
                    </div>
                </div>
            </div>
        `;
    });
}

// 3. Detalle del Producto (Modal)
function showDetail(id) {
    const product = products.find(p => p.id === id);
    const content = document.getElementById('product-detail-content');
    
    content.innerHTML = `
        <div class="modal-header">
            <h5 class="modal-title">${product.title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body text-center">
            <img src="${product.image}" class="modal-product-img mb-4">
            <div class="text-start px-3">
                <p><strong>Categoría:</strong> <span class="badge bg-secondary">${product.category}</span></p>
                <p>${product.description}</p>
                <h3 class="text-primary fw-bold">$${product.price.toFixed(2)}</h3>
                <div class="d-flex align-items-center gap-3">
                    <input type="number" id="qty-${product.id}" class="form-control w-25" value="1" min="1">
                    <button class="btn btn-success flex-grow-1" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> Agregar al Carrito
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const myModal = new bootstrap.Modal(document.getElementById('productModal'));
    myModal.show();
}

// 4. Lógica del Carrito
function addToCart(id) {
    const product = products.find(p => p.id === id);
    const qty = parseInt(document.getElementById(`qty-${id}`).value);
    
    const existing = cart.find(item => item.id === id);
    if(existing) {
        existing.qty += qty;
    } else {
        cart.push({...product, qty});
    }
    
    updateCart();
    // Cerrar modal actual
    bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
    alert("¡Producto añadido! 🛍️");
}

function updateCart() {
    localStorage.setItem('shopmaster_cart', JSON.stringify(cart));
    const cartCount = document.getElementById('cart-count');
    const cartList = document.getElementById('cart-items-list');
    const cartTotal = document.getElementById('cart-total');
    
    cartCount.innerText = cart.reduce((acc, item) => acc + item.qty, 0);
    
    if(cart.length === 0) {
        cartList.innerHTML = '<p class="text-center">El carrito está vacío.</p>';
        cartTotal.innerText = '0.00';
        return;
    }
    
    cartList.innerHTML = '';
    let total = 0;
    
    cart.forEach((item, index) => {
        total += item.price * item.qty;
        cartList.innerHTML += `
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <img src="${item.image}" width="50" class="me-3">
                <div class="flex-grow-1">
                    <small class="d-block fw-bold">${item.title.substring(0,20)}...</small>
                    <small>$${item.price} x ${item.qty}</small>
                </div>
                <button class="btn btn-sm btn-danger" onclick="removeItem(${index})"><i class="fas fa-trash"></i></button>
            </div>
        `;
    });
    
    cartTotal.innerText = total.toFixed(2);
}

function removeItem(index) {
    cart.splice(index, 1);
    updateCart();
}

// 5. Simulación de Pago y Generación de Ticket
document.getElementById('payment-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const cliente = document.getElementById('pay-name').value;
    
    // Generar PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        unit: "mm",
        format: [80, 150] // Formato ticket térmico
    });

    doc.setFont("courier", "bold");
    doc.setFontSize(14);
    doc.text("SHOPMASTER STORE", 40, 10, {align: "center"});
    
    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    doc.text("--------------------------------", 40, 15, {align: "center"});
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 5, 20);
    doc.text(`Cliente: ${cliente}`, 5, 25);
    doc.text("--------------------------------", 40, 30, {align: "center"});

    let y = 35;
    let total = 0;

    cart.forEach(item => {
        const subtotal = item.price * item.qty;
        total += subtotal;
        doc.text(`${item.qty}x ${item.title.substring(0,15)}...`, 5, y);
        doc.text(`$${subtotal.toFixed(2)}`, 65, y);
        y += 5;
    });

    doc.text("--------------------------------", 40, y + 5, {align: "center"});
    doc.setFont("courier", "bold");
    doc.text(`TOTAL: $${total.toFixed(2)}`, 40, y + 10, {align: "center"});
    doc.text("¡GRACIAS POR SU COMPRA!", 40, y + 20, {align: "center"});

    doc.save(`Ticket_ShopMaster.pdf`);
    
    // Limpiar carrito
    cart = [];
    updateCart();
    alert("¡Pago exitoso! Se ha generado su ticket.");
    location.reload();
});

// Inicializar
fetchProducts();
updateCart();