import {
  FILTER,
  STATUS,
  TEST_ORDERS,
  changeOrderStatus,
  createOrderState,
  getFilteredOrders,
  getStatusCounts,
} from './order-model.js';

const STORAGE_KEY = 'demo-orders-statuses-v1';

const filterLabels = Object.freeze({
  [FILTER.all]: 'Все',
  [FILTER.new]: 'Новые',
  [FILTER.in_progress]: 'В работе',
  [FILTER.assembled]: 'Собранные',
  [FILTER.cancelled]: 'Отменённые',
});

const statusLabels = Object.freeze({
  [STATUS.new]: 'Новый',
  [STATUS.in_progress]: 'В работе',
  [STATUS.assembled]: 'Собран',
  [STATUS.cancelled]: 'Отменён',
});

const statusActions = Object.freeze([
  { status: STATUS.in_progress, label: 'Взять в работу' },
  { status: STATUS.assembled, label: 'Собран' },
  { status: STATUS.cancelled, label: 'Отменён' },
]);

const filterList = document.querySelector('#filter-list');
const orderList = document.querySelector('#order-list');
const storageNote = document.querySelector('#storage-note');
const visibleSummary = document.querySelector('#visible-summary');

let activeFilter = FILTER.all;
let state = createOrderState(TEST_ORDERS, readSavedStatuses());

function readSavedStatuses() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    showStorageNote();
    return {};
  }
}

function saveStatuses() {
  try {
    const statuses = Object.fromEntries(state.orders.map((order) => [order.id, order.status]));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
  } catch {
    showStorageNote();
  }
}

function showStorageNote() {
  storageNote.hidden = false;
  storageNote.textContent = 'Изменения сохранятся только до обновления страницы.';
}

function formatRubles(amount) {
  return new Intl.NumberFormat('ru-RU').format(amount).replace(/\u00a0/g, ' ') + ' ₽';
}

function render() {
  const counts = getStatusCounts(state);
  const visibleOrders = getFilteredOrders(state, activeFilter);
  renderFilters(counts);
  renderOrders(visibleOrders);
  visibleSummary.textContent = `${visibleOrders.length} из ${counts.all}`;
}

function renderFilters(counts) {
  filterList.replaceChildren(
    ...Object.values(FILTER).map((filter) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'filter-button';
      button.dataset.filter = filter;
      button.setAttribute('aria-pressed', String(activeFilter === filter));
      button.innerHTML = `<span>${filterLabels[filter]}</span><strong>${counts[filter]}</strong>`;
      return button;
    }),
  );
}

function renderOrders(orders) {
  if (orders.length === 0) {
    orderList.innerHTML = '<div class="empty-state"><p class="empty-mark" aria-hidden="true">—</p><h2>Пустая выборка</h2><p>В этой категории пока нет тестовых заказов.</p></div>';
    return;
  }

  orderList.replaceChildren(...orders.map(createOrderCard));
}

function createOrderCard(order) {
  const article = document.createElement('article');
  article.className = `order-card status-${order.status}`;
  article.innerHTML = `
    <div class="status-marker" aria-hidden="true"></div>
    <div class="order-core">
      <div class="order-heading">
        <div>
          <p class="order-id">${order.id}</p>
          <h2>${order.customer}</h2>
        </div>
        <p class="status-label"><span class="status-dot" aria-hidden="true"></span>${statusLabels[order.status]}</p>
      </div>
      <div class="order-meta">
        <span>${order.placedAt}</span>
        <strong>${formatRubles(order.total)}</strong>
      </div>
      <details class="composition">
        <summary>Состав заказа <span>${order.items.length} поз.</span></summary>
        <ul>${order.items.map((item) => `<li><span>${item.title} · ${item.size} · ${item.quantity} шт.</span><strong>${formatRubles(item.price * item.quantity)}</strong></li>`).join('')}</ul>
      </details>
    </div>
    <div class="order-actions" aria-label="Изменить статус заказа ${order.id}">
      ${statusActions.map((action) => `<button type="button" class="status-action ${action.status === order.status ? 'is-current' : ''}" data-order-id="${order.id}" data-status="${action.status}" ${action.status === order.status ? 'aria-current="true"' : ''}>${action.label}</button>`).join('')}
    </div>
  `;
  return article;
}

document.addEventListener('click', (event) => {
  const filterButton = event.target.closest('[data-filter]');
  if (filterButton) {
    activeFilter = filterButton.dataset.filter;
    render();
    return;
  }

  const actionButton = event.target.closest('[data-order-id][data-status]');
  if (actionButton) {
    state = changeOrderStatus(state, actionButton.dataset.orderId, actionButton.dataset.status);
    saveStatuses();
    render();
    return;
  }

  if (event.target.closest('[data-reset]')) {
    state = createOrderState(TEST_ORDERS);
    activeFilter = FILTER.all;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      showStorageNote();
    }
    render();
  }
});

render();
