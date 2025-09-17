export function groupItemsByCategory(items) {
  const groups = {};
  items.forEach(item => {
    const catName = item.categoryName || 'Other';
    if (!groups[catName]) groups[catName] = [];
    groups[catName].push(item);
  });
  return groups;
}