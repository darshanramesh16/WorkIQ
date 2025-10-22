-- Link existing employee records to test user accounts
-- This allows the seeded data to be visible when logging in with test accounts

-- Create a trigger to auto-link employees to users based on email match
CREATE OR REPLACE FUNCTION link_employee_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new user signs up, check if there's an employee with matching email
  UPDATE employees 
  SET user_id = NEW.id 
  WHERE email = NEW.email AND user_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to run after user creation
DROP TRIGGER IF EXISTS on_auth_user_created_link_employee ON auth.users;
CREATE TRIGGER on_auth_user_created_link_employee
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION link_employee_to_user();

-- Pre-populate some employee emails that match test accounts for easier testing
-- Now when you sign up with these emails, you'll automatically see the corresponding employee data
UPDATE employees SET email = 'admin@hrms.com' WHERE employee_id = 'EMP001';
UPDATE employees SET email = 'hr@hrms.com' WHERE employee_id = 'EMP002';
UPDATE employees SET email = 'manager@hrms.com' WHERE employee_id = 'EMP003';
UPDATE employees SET email = 'employee@hrms.com' WHERE employee_id = 'EMP004';