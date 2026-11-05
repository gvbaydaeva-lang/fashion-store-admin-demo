import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FILTER,
  TEST_ORDERS,
  changeOrderStatus,
  createOrderState,
  getFilteredOrders,
  getStatusCounts,
} from '../site/order-model.js';

test('changes one test order status without mutating the original state', () => {
  const original = createOrderState(TEST_ORDERS, {});
  const changed = changeOrderStatus(original, 'D-1001', 'in_progress');

  assert.equal(original.orders[0].status, 'new');
  assert.equal(changed.orders[0].status, 'in_progress');
});

test('restores only a valid saved status for a known test order', () => {
  const state = createOrderState(TEST_ORDERS, {
    'D-1001': 'assembled',
    missing: 'cancelled',
  });

  assert.equal(state.orders[0].status, 'assembled');
  assert.equal(state.orders.length, TEST_ORDERS.length);
});

test('filters test orders and recalculates counters after a status change', () => {
  const changed = changeOrderStatus(
    createOrderState(TEST_ORDERS),
    'D-1001',
    'assembled',
  );

  assert.deepEqual(
    getFilteredOrders(changed, FILTER.assembled).map((order) => order.id),
    ['D-1001', 'D-1003', 'D-1006'],
  );
  assert.deepEqual(getStatusCounts(changed), {
    all: 6,
    new: 1,
    in_progress: 1,
    assembled: 3,
    cancelled: 1,
  });
});

test('ignores an invalid saved status instead of replacing a fixture status', () => {
  const state = createOrderState(TEST_ORDERS, { 'D-1001': 'not-a-status' });

  assert.equal(state.orders[0].status, 'new');
});
