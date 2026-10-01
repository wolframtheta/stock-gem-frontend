import { moveVariant, withSortOrder } from './variant-order.util';

describe('variant-order.util', () => {
  const list = ['S', 'M', 'L', 'XL'];

  it('mou avall', () => {
    expect(moveVariant(list, 0, 2)).toEqual(['M', 'L', 'S', 'XL']);
  });

  it('mou amunt', () => {
    expect(moveVariant(list, 3, 1)).toEqual(['S', 'XL', 'M', 'L']);
  });

  it('mateix índex: sense canvis', () => {
    expect(moveVariant(list, 1, 1)).toEqual(list);
  });

  it('límits fora de rang: sense canvis', () => {
    expect(moveVariant(list, -1, 2)).toEqual(list);
    expect(moveVariant(list, 0, 4)).toEqual(list);
  });

  it('no muta l\'original', () => {
    const original = [...list];
    moveVariant(list, 0, 3);
    expect(list).toEqual(original);
  });

  it('withSortOrder renumera 0..N-1 sense tocar altres camps', () => {
    const rows = [
      { label: 'M', warehouseQuantity: 3, sortOrder: 9 },
      { label: 'S', warehouseQuantity: 0, sortOrder: 9 },
    ];
    expect(withSortOrder(rows)).toEqual([
      { label: 'M', warehouseQuantity: 3, sortOrder: 0 },
      { label: 'S', warehouseQuantity: 0, sortOrder: 1 },
    ]);
  });
});
