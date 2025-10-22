-- Allow users to insert their own employee record
CREATE POLICY "Users can insert their own employee record"
  ON public.employees FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own employee record
CREATE POLICY "Users can view their own employee record"
  ON public.employees FOR SELECT
  USING (auth.uid() = user_id);
