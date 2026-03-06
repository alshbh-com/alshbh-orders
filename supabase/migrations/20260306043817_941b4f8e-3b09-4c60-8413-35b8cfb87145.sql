
-- Allow users to delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to delete complaints (already have ALL policy)
-- Allow store owners to delete their own orders
CREATE POLICY "Store owners can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM stores
  WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()
));

-- Allow store owners to delete order items for their orders
CREATE POLICY "Store owners can delete order items"
ON public.order_items
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM orders
  JOIN stores ON stores.id = orders.store_id
  WHERE orders.id = order_items.order_id AND stores.owner_id = auth.uid()
));
