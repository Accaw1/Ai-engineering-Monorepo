import type { Location, MenuItem } from "../types/models.ts";

export function findLocationById(locations: Location[], id: string): Location | null {
  for (const location of locations) {
    if (location.id === id) {
      return location;
    }
  }
  return null;
}

export function findMenuItemByName(items: MenuItem[], name: string): MenuItem | null {
  const normalizedName = name.trim().toLowerCase();
  if (normalizedName === "") {
    return null;
  }

  for (const item of items) {
    if (item.name.trim().toLowerCase() === normalizedName) {
      return item;
    }
  }
  return null;
}

export function binarySearchLocationByCapacity(sortedLocations: Location[], targetCapacity: number): number {
  let low = 0;
  let high = sortedLocations.length - 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const middleCapacity = sortedLocations[middle].seatingCapacity;

    if (middleCapacity === targetCapacity) {
      return middle;
    }
    if (middleCapacity < targetCapacity) {
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return -1;
}
