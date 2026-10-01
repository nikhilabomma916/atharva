CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('citizen', 'officer', 'admin')),
  display_name VARCHAR(100) NOT NULL CHECK (length(trim(display_name)) >= 2),
  account_status TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

CREATE TABLE citizen_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(100) NOT NULL CHECK (length(trim(full_name)) >= 2),
  gender TEXT NOT NULL CHECK (gender IN ('female', 'male', 'non_binary', 'prefer_not_to_say', 'other')),
  gender_other VARCHAR(60),
  date_of_birth DATE NOT NULL CHECK (date_of_birth <= (CURRENT_DATE - INTERVAL '13 years')::date),
  phone_number VARCHAR(13) NOT NULL CHECK (phone_number ~ '^\+91[6-9][0-9]{9}$'),
  address VARCHAR(250) NOT NULL CHECK (length(trim(address)) BETWEEN 5 AND 250),
  city VARCHAR(100) NOT NULL CHECK (length(trim(city)) BETWEEN 2 AND 100),
  state VARCHAR(100) NOT NULL CHECK (state IN (
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  )),
  pincode CHAR(6) NOT NULL CHECK (pincode ~ '^[0-9]{6}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (gender = 'other' OR gender_other IS NULL)
);

CREATE INDEX users_role_status_idx ON users (role, account_status);