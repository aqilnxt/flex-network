-- Public can read VERIFIED work history only (talent public profile)
CREATE POLICY "work_history_public_select_verified"
ON public.work_history
FOR SELECT
TO anon, authenticated
USING (verification_status = 'VERIFIED');
