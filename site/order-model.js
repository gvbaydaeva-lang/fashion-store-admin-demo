export const STATUS = Object.freeze({
  new: 'new',
  in_progress: 'in_progress',
  assembled: 'assembled',
  cancelled: 'cancelled',
});

export const FILTER = Object.freeze({
  all: 'all',
  ...STATUS,
});

const frozenItem = (title, size, quantity, price) => Object.freeze({
  title,
  size,
  quantity,
  price,
});

const frozenOrder = (order) => Object.freeze({
  ...order,
  items: Object.freeze(order.items),
});

export const TEST_ORDERS = Object.freeze([
  frozenOrder({
    id: 'D-1001',
    customer: 'Анна К.',
    placedAt: '4 ноября, 10:15',
    total: 4980,
    status: STATUS.new,
    items: [frozenItem('Платье «Линия»', 'M', 1, 4980)],
  }),
  frozenOrder({
    id: 'D-1002',
    customer: 'Мария В.',
    placedAt: '4 ноября, 11:05',
    total: 6290,
    status: STATUS.in_progress,
    items: [
      frozenItem('Жакет «Ритм»', 'S', 1, 4290),
      frozenItem('Топ «Мягкий свет»', 'S', 1, 2000),
    ],
  }),
  frozenOrder({
    id: 'D-1003',
    customer: 'Елена Р.',
    placedAt: '4 ноября, 11:40',
    total: 3590,
    status: STATUS.assembled,
    items: [frozenItem('Юбка «Круг»', 'L', 1, 3590)],
  }),
  frozenOrder({
    id: 'D-1004',
    customer: 'Софья Н.',
    placedAt: '4 ноября, 12:20',
    total: 5480,
    status: STATUS.new,
    items: [
      frozenItem('Брюки «Точка опоры»', 'M', 1, 3980),
      frozenItem('Ремень «Контур»', 'One size', 1, 1500),
    ],
  }),
  frozenOrder({
    id: 'D-1005',
    customer: 'Дарья Л.',
    placedAt: '4 ноября, 13:10',
    total: 2790,
    status: STATUS.cancelled,
    items: [frozenItem('Блуза «Воздух»', 'XS', 1, 2790)],
  }),
  frozenOrder({
    id: 'D-1006',
    customer: 'Полина Т.',
    placedAt: '4 ноября, 14:00',
    total: 7890,
    status: STATUS.assembled,
    items: [
      frozenItem('Пальто «Тёплый штрих»', 'M', 1, 6490),
      frozenItem('Платок «Охра»', 'One size', 1, 1400),
    ],
  }),
]);

export function createOrderState(orders, savedStatuses = {}) {
  return {
    orders: orders.map((order) => ({
      ...order,
      status: isKnownStatus(savedStatuses[order.id])
        ? savedStatuses[order.id]
        : order.status,
    })),
  };
}

export function getFilteredOrders(state, filter) {
  if (filter === FILTER.all) return state.orders;
  return state.orders.filter((order) => order.status === filter);
}

export function getStatusCounts(state) {
  const counts = {
    all: state.orders.length,
    new: 0,
    in_progress: 0,
    assembled: 0,
    cancelled: 0,
  };

  state.orders.forEach((order) => {
    counts[order.status] += 1;
  });

  return counts;
}

function isKnownStatus(value) {
  return Object.values(STATUS).includes(value);
}

export function changeOrderStatus(state, orderId, nextStatus) {
  if (!Object.values(STATUS).includes(nextStatus)) {
    throw new Error('Unknown status');
  }

  let found = false;
  const orders = state.orders.map((order) => {
    if (order.id !== orderId) return order;
    found = true;
    return { ...order, status: nextStatus };
  });

  if (!found) {
    throw new Error('Unknown order');
  }

  return { orders };
}
