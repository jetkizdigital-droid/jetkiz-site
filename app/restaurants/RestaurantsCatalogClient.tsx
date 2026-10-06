"use client";

import type { PublicHomeCms, PublicRestaurant } from "../lib/jetkiz-api";
import { RestaurantsCatalogClient as RestaurantsCatalogClientImpl } from "./RestaurantsCatalogClientImpl";

/**
 * Compatibility wrapper: older rendered tests and any internal callers may
 * still render the catalogue without the mobile-home pinned list.
 */
export function RestaurantsCatalogClient({
  restaurants,
  home,
  pinnedRestaurantIds = [],
}: {
  restaurants: PublicRestaurant[];
  home: PublicHomeCms;
  pinnedRestaurantIds?: string[];
}) {
  return (
    <RestaurantsCatalogClientImpl
      restaurants={restaurants}
      home={home}
      pinnedRestaurantIds={pinnedRestaurantIds}
    />
  );
}
