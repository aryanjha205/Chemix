let inventory = [];
let cart = [];

const API_URL = 'https://catalyst-ai-pink.vercel.app/api/inventory/public';
const WHATSAPP_NUMBER = '9835089300';

const DOM = {
    productsGrid: document.getElementById('productsGrid'),
    cartBtn: document.getElementById('cartBtn'),
    cartSidebar: document.getElementById('cartSidebar'),
    closeCartBtn: document.getElementById('closeCartBtn'),
    cartOverlay: document.getElementById('cartOverlay'),
    cartItems: document.getElementById('cartItems'),
    cartCount: document.getElementById('cartCount'),
    cartTotal: document.getElementById('cartTotal'),
    checkoutBtn: document.getElementById('checkoutBtn')
};

async function init() {
    setupEventListeners();
    const success = await fetchInventory();
    if (success) {
        renderProducts();
    }
}

async function fetchInventory() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        inventory = await response.json();
        return true;
    } catch (error) {
        console.error('Failed to fetch inventory:', error);
        DOM.productsGrid.innerHTML = `
            <div class="loading" style="color: #ef4444;">
                Failed to load products from API. Please ensure your backend is accessible and CORS is configured. 
                (Note: Vercel blocks fetching from localhost due to Mixed Content security).
            </div>
        `;
        return false;
    }
}

function getDrumHTML(name, hazardClass) {
    let drumClass = 'drum-safe';
    let icon = 'fa-leaf';
    
    if (hazardClass && hazardClass.toLowerCase().includes('flammable')) {
        drumClass = 'drum-flammable';
        icon = 'fa-fire';
    } else if (hazardClass && hazardClass.toLowerCase().includes('toxic')) {
        drumClass = 'drum-toxic';
        icon = 'fa-skull-crossbones';
    }

    return `
        <div class="chemical-drum ${drumClass}" style="margin: 0 auto 1.5rem auto; transform: scale(0.85); transform-origin: top center;">
            <div class="drum-top"></div>
            <div class="drum-body">
                <div class="drum-band drum-band-1"></div>
                <div class="hazard-diamond">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div class="drum-label">${escapeHTML(name)}</div>
                <div class="drum-band drum-band-2"></div>
            </div>
            <div class="drum-bottom"></div>
        </div>
    `;
}

function renderProducts() {
    if (inventory.length === 0) {
        DOM.productsGrid.innerHTML = '<div class="loading">No products available at the moment.</div>';
        return;
    }

    DOM.productsGrid.innerHTML = inventory.map(product => {
        // Fallback for missing properties
        const name = product.chemical_name || 'Unnamed Chemical';
        const code = product.product_code || 'N/A';
        const price = product.selling_price || 0;
        const category = product.category || 'General';

        return `
            <div class="product-card" style="text-align: center;">
                ${getDrumHTML(name, product.hazard_class)}
                <h3 class="product-title">${escapeHTML(name)}</h3>
                <div class="product-meta">
                    <span><strong>Code:</strong> ${escapeHTML(code)}</span>
                    <span><strong>Category:</strong> ${escapeHTML(category)}</span>
                </div>
                <div class="product-price">₹${price.toFixed(2)}</div>
                <button class="add-to-cart" onclick="addToCart('${product.id}')">
                    Add to Cart
                </button>
            </div>
        `;
    }).join('');
}

function addToCart(productId) {
    const product = inventory.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    updateCartUI();
    openCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
}

function updateCartUI() {
    DOM.cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cart.length === 0) {
        DOM.cartItems.innerHTML = '<div style="text-align:center; color:var(--text-muted); margin-top:2rem;">Your cart is empty</div>';
    } else {
        DOM.cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${escapeHTML(item.chemical_name)}</h4>
                    <div style="font-size:0.875rem; color:var(--text-muted);">
                        ₹${(item.selling_price || 0).toFixed(2)} x ${item.quantity}
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:1rem;">
                    <div class="cart-item-price">
                        ₹${((item.selling_price || 0) * item.quantity).toFixed(2)}
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    const total = cart.reduce((sum, item) => sum + ((item.selling_price || 0) * item.quantity), 0);
    DOM.cartTotal.textContent = `₹${total.toFixed(2)}`;
}

function openCart() {
    DOM.cartSidebar.classList.add('open');
    DOM.cartOverlay.classList.add('open');
}

function closeCart() {
    DOM.cartSidebar.classList.remove('open');
    DOM.cartOverlay.classList.remove('open');
}

function checkout() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    let message = "Hello ChemStore! I would like to place an order:%0A%0A";
    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = (item.selling_price || 0) * item.quantity;
        total += itemTotal;
        message += `${index + 1}. *${item.chemical_name}*%0A`;
        message += `   Quantity: ${item.quantity}%0A`;
        message += `   Price: ₹${itemTotal.toFixed(2)}%0A%0A`;
    });

    message += `*Total Order Value:* ₹${total.toFixed(2)}%0A%0A`;
    message += "Please let me know the payment and delivery details.";

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(whatsappUrl, '_blank');
}

function setupEventListeners() {
    DOM.cartBtn.addEventListener('click', openCart);
    DOM.closeCartBtn.addEventListener('click', closeCart);
    DOM.cartOverlay.addEventListener('click', closeCart);
    DOM.checkoutBtn.addEventListener('click', checkout);
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Start app
init();
