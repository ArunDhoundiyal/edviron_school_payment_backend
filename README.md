## Edviron School Payment Backend
This repository hosts the backend for the Edviron School Payment System, deployed on Render. The backend provides APIs for user registration, login, profile management, and transaction handling. These APIs can be consumed by frontend applications to enable a seamless payment and user management experience.
## User table schema 
CREATE TABLE user(id TEXT NOT NULL PRIMARY KEY, name VARCHAR(256), email TEXT, password TEXT, register_time TEXT, login_time TEXT); 

0|id|TEXT|1||1
1|name|VARCHAR(256)|0||0
2|email|TEXT|0||0
3|password|TEXT|0||0
4|register_time|DATETIME|0|TEXT|0
5|login_time|TEXT|0||0 

## transaction table schema 
CREATE TABLE "transaction"(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, user_id TEXT, collect_id TEXT, school_id TEXT, gateway TEXT, order_amount TEXT, transaction_amount TEXT, status TEXT, custom_order_id TEXT, date DATE, FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE); 
collect_id,school_id,gateway,order_amount,transaction_amount,status,custom_order_id,date

0|id|INTEGER|1||1
1|user_id|TEXT|0||0
2|collect_id|TEXT|0||0
3|school_id|TEXT|0||0
4|gateway|TEXT|0||0
5|order_amount|TEXT|0||0
6|transaction_amount|TEXT|0||0
7|status|TEXT|0||0
8|custom_order_id|TEXT|0||0

## APIs
## User Regisration (Method: POST)
* POST https://edviron-school-payment-backend-2.onrender.com/registration
    {"name": "string",
  "email": "string",
  "password": "string",
  }
## User Login (Method: POST)
* POST https://edviron-school-payment-backend-2.onrender.com/login
  {
  "email": "string",
  "password": "string"
  }
  * Response Body
  * {
  "token": "string"
}
    
## User Profile (Method: GET)
* GET https://edviron-school-payment-backend-2.onrender.com/user/profile
* Headers
    {
  "Authorization": "Bearer <JWT_TOKEN>"
    }
## All Transaction (Method: GET) 
* GET [https://edviron-school-payment-backend-2.onrender.com/user/profile](https://edviron-school-payment-backend-2.onrender.com/transaction?status=Failed&startDate=2024-01-01&endDate=2024-12-31&pageNo=1)
* Query Parameters:
* status (string): Status of the transaction (Pending, Success, Failed).
* startDate (string): Start date in YYYY-MM-DD format.
* endDate (string): End date in YYYY-MM-DD format.
* pageNo (integer): Page number for pagination.
*  Headers
    {
  "Authorization": "Bearer <JWT_TOKEN>"
    }

## Update Status (Method: PUT)
* PUT https://edviron-school-payment-backend-2.onrender.com/transactions/status-update/:id
* Headers
    {
  "Authorization": "Bearer <JWT_TOKEN>"
    }
## Fetch Transactions by School (Method:GET)
* GET https://edviron-school-payment-backend-2.onrender.com/transaction/school/:schoolId
  * Headers
    {
  "Authorization": "Bearer <JWT_TOKEN>"
    }
##  Transaction Status Check by orderId (Method:GET)
GET https://edviron-school-payment-backend-2.onrender.com/transactions/status/:orderId
  * Headers
    {
  "Authorization": "Bearer <JWT_TOKEN>"
    }

