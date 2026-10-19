document.addEventListener("DOMContentLoaded", () => {
  const cartCount = document.getElementById("cartCount");
  const cartToast = document.getElementById("cartToast");
  const toastMessage = document.getElementById("toastMessage");
  const cartButton = document.getElementById("cartButton");

  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  const cartDrawer = document.getElementById("cartDrawer");
  const cartOverlay = document.getElementById("cartOverlay");
  const cartClose = document.getElementById("cartClose");
  const cartItemsEl = document.getElementById("cartItems");
  const cartEmptyEl = document.getElementById("cartEmpty");
  const cartFooterEl = document.getElementById("cartFooter");
  const cartTotalEl = document.getElementById("cartTotal");
  const cartClearBtn = document.getElementById("cartClear");

  const ratingToast = document.getElementById("ratingToast");
  const ratingToastMessage = document.getElementById("ratingToastMessage");
  let ratingToastTimer;

  let toastTimer;

  /* Корзина: name -> { name, price, emoji, qty } */
  const cart = {};

  /* ---------- Mobile menu ---------- */

  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.textContent = isOpen ? "✕" : "☰";
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Закрыть меню" : "Открыть меню"
    );
  });

  /* Закрываем мобильное меню после перехода */

  document.querySelectorAll("nav a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.textContent = "☰";
      menuToggle.setAttribute("aria-label", "Открыть меню");
    });
  });

  /* ---------- Cart logic ---------- */

  function cartTotalQty() {
    return Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  }

  function cartTotalSum() {
    return Object.values(cart).reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );
  }

  function formatPrice(value) {
    return `${value.toLocaleString("ru-RU")} ₽`;
  }

  function addToCart(name, price, emoji) {
    if (cart[name]) {
      cart[name].qty += 1;
    } else {
      cart[name] = { name, price, emoji, qty: 1 };
    }

    updateBadge();
    renderCart();
  }

  function updateBadge() {
    cartCount.textContent = cartTotalQty();

    cartCount.classList.remove("pop");
    void cartCount.offsetWidth; // перезапускаем animation
    cartCount.classList.add("pop");
  }

  function renderCart() {
    const items = Object.values(cart);
    const isEmpty = items.length === 0;

    cartEmptyEl.style.display = isEmpty ? "grid" : "none";
    cartFooterEl.style.display = isEmpty ? "none" : "block";

    if (isEmpty) {
      cartItemsEl.innerHTML = "";
      cartTotalEl.textContent = formatPrice(0);
      return;
    }

    cartItemsEl.innerHTML = items
      .map(
        (item) => `
          <div class="cart-item">
            <div class="cart-item-emoji" aria-hidden="true">
              <img src="${item.emoji}" alt="" />
            </div>

            <div class="cart-item-info">
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-price">${formatPrice(item.price)} / шт</div>

              <div class="qty-control">
                <button class="qty-btn" type="button" data-action="minus" data-name="${item.name}" aria-label="Уменьшить количество: ${item.name}">−</button>
                <span class="qty-value">${item.qty}</span>
                <button class="qty-btn" type="button" data-action="plus" data-name="${item.name}" aria-label="Увеличить количество: ${item.name}">+</button>
              </div>
            </div>

            <div class="cart-item-right">
              <strong class="cart-item-total">${formatPrice(item.price * item.qty)}</strong>
              <button class="cart-item-remove" type="button" data-action="remove" data-name="${item.name}" aria-label="Удалить из корзины: ${item.name}">✕</button>
            </div>
          </div>
        `
      )
      .join("");

    cartTotalEl.textContent = formatPrice(cartTotalSum());
  }

  function changeQty(name, delta) {
    if (!cart[name]) return;

    cart[name].qty += delta;

    if (cart[name].qty <= 0) {
      delete cart[name];
    }

    updateBadge();
    renderCart();
  }

  function removeFromCart(name) {
    if (!cart[name]) return;

    delete cart[name];
    updateBadge();
    renderCart();
    showToast(`«${name}» удалён из корзины`);
  }

  function clearCart() {
    Object.keys(cart).forEach((name) => delete cart[name]);
    updateBadge();
    renderCart();
  }

  function openCart() {
    renderCart();
    cartDrawer.classList.add("open");
    cartOverlay.classList.add("show");
    document.body.classList.add("cart-open");
    cartDrawer.setAttribute("aria-hidden", "false");
    cartOverlay.setAttribute("aria-hidden", "false");
  }

  function closeCart() {
    cartDrawer.classList.remove("open");
    cartOverlay.classList.remove("show");
    document.body.classList.remove("cart-open");
    cartDrawer.setAttribute("aria-hidden", "true");
    cartOverlay.setAttribute("aria-hidden", "true");
  }

  /* ---------- Add to cart ---------- */

  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".product-card");
      const name = button.dataset.product;
      const price = parseInt(
        card.querySelector(".price").textContent.replace(/\D/g, ""),
        10
      );
      const emoji = card
        .querySelector(".product-emoji img")
        .getAttribute("src");

      addToCart(name, price, emoji);

      button.textContent = "✓ Добавлено";
      button.classList.add("added");

      showToast(`«${name}» добавлен в корзину`);

      setTimeout(() => {
        button.textContent = "В корзину";
        button.classList.remove("added");
      }, 1400);
    });
  });

  /* ---------- Cart drawer ---------- */

  cartButton.addEventListener("click", openCart);
  cartClose.addEventListener("click", closeCart);
  cartOverlay.addEventListener("click", closeCart);

  /* Кнопки внутри корзины: + / − / удалить */
  cartItemsEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const { action, name } = button.dataset;

    if (action === "plus") changeQty(name, 1);
    if (action === "minus") changeQty(name, -1);
    if (action === "remove") removeFromCart(name);
  });

  cartClearBtn.addEventListener("click", () => {
    clearCart();
    showToast("Корзина очищена");
  });

  /* ---------- Catalog filters ---------- */

  const filterEmpty = document.getElementById("filterEmpty");

  function applyFilter(filter) {
    let visible = 0;

    document.querySelectorAll(".product-card").forEach((card) => {
      const match = filter === "all" || card.dataset.category === filter;
      card.style.display = match ? "" : "none";
      if (match) visible += 1;
    });

    document.querySelectorAll(".filter-chip").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.filter === filter);
    });

    document.querySelectorAll(".category-card").forEach((card) => {
      card.classList.toggle("active", card.dataset.filter === filter);
    });

    filterEmpty.style.display = visible > 0 ? "none" : "block";
  }

  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      applyFilter(chip.dataset.filter);
      document
        .getElementById("catalog")
        .scrollIntoView({ behavior: "smooth" });
    });
  });

  /* Карточки категорий фильтруют каталог */
  document.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      event.preventDefault();
      applyFilter(card.dataset.filter);
      document
        .getElementById("catalog")
        .scrollIntoView({ behavior: "smooth" });
    });
  });

  /* Ссылки «в каталог» показывают все товары и закрывают корзину */
  document.querySelectorAll('a[href="#catalog"]').forEach((link) => {
    link.addEventListener("click", () => {
      applyFilter("all");
      closeCart();
    });
  });

  /* ---------- Ratings ---------- */

  function pluralRatings(count) {
    const n = Math.abs(count) % 100;
    const n1 = n % 10;

    if (n > 10 && n < 20) return `${count} оценок`;
    if (n1 > 1 && n1 < 5) return `${count} оценки`;
    if (n1 === 1) return `${count} оценка`;
    return `${count} оценок`;
  }

  document.querySelectorAll(".product-rating").forEach((widget) => {
    const stars = Array.from(widget.querySelectorAll(".star"));
    const valueEl = widget.querySelector(".rating-value");
    const countEl = widget.querySelector(".rating-count");
    const removeBtn = widget.querySelector(".rating-remove");

    const state = {
      total: parseFloat(widget.dataset.total || 0),
      count: parseInt(widget.dataset.count || 0, 10),
      user: 0,
    };

    function average() {
      return state.count > 0 ? state.total / state.count : 0;
    }

    /* Рисуем звёзды под заданное значение (среднее или превью) */
    function draw(targetValue) {
      stars.forEach((star, i) => {
        const idx = i + 1;
        let fill = 0;

        if (targetValue >= idx) {
          fill = 100;
        } else if (targetValue > idx - 1) {
          fill = (targetValue - (idx - 1)) * 100;
        }

        star.style.setProperty("--fill", `${fill}%`);
      });
    }

    function render() {
      const avg = average();

      draw(avg);

      valueEl.textContent =
        state.count > 0 ? avg.toFixed(1).replace(".", ",") : "0,0";
      countEl.textContent = pluralRatings(state.count);

      removeBtn.hidden = state.user === 0;

      stars.forEach((star) => {
        const value = parseInt(star.dataset.value, 10);
        star.setAttribute("aria-pressed", String(value <= state.user));
      });
    }

    function animateValue() {
      valueEl.classList.remove("pop");
      void valueEl.offsetWidth;
      valueEl.classList.add("pop");
    }

    stars.forEach((star) => {
      const value = parseInt(star.dataset.value, 10);

      /* Превью при наведении и при фокусе */
      star.addEventListener("mouseenter", () => draw(value));
      star.addEventListener("focus", () => draw(value));

      star.addEventListener("click", () => {
        if (state.user === 0) {
          /* Первая оценка — увеличиваем счётчик */
          state.count += 1;
        } else {
          /* Меняем свою оценку — счётчик не трогаем */
          state.total -= state.user;
        }

        state.total += value;
        state.user = value;

        render();
        animateValue();
        showRatingToast(`Вы поставили ${value} из 5 звёзд`);
      });
    });

    /* Возвращаем отображение к среднему после ухода курсора/фокуса */
    widget.addEventListener("mouseleave", () => draw(average()));
    widget.addEventListener("focusout", () => draw(average()));

    removeBtn.addEventListener("click", () => {
      if (state.user === 0) return;

      state.total -= state.user;
      state.count -= 1;
      state.user = 0;

      render();
      animateValue();
    });

    render();
  });

  /* ---------- Toast ---------- */

  function showToast(message) {
    clearTimeout(toastTimer);

    toastMessage.textContent = message;
    cartToast.classList.add("show");

    toastTimer = setTimeout(() => {
      cartToast.classList.remove("show");
    }, 2800);
  }

  function showRatingToast(message) {
    clearTimeout(ratingToastTimer);

    ratingToastMessage.textContent = message;
    ratingToast.classList.add("show");

    ratingToastTimer = setTimeout(() => {
      ratingToast.classList.remove("show");
    }, 2800);
  }

  /* ---------- Keyboard accessibility ---------- */

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.textContent = "☰";
      menuToggle.setAttribute("aria-label", "Открыть меню");
      closeCart();
    }
  });
});