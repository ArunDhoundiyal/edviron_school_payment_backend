const express = require('express')
const {v4:uuidv4} = require('uuid')
const {checkUserCredentials, checkUserLoginCredentials} = require('./checkUserCredentials')
const {dateTime, date} = require('./dateTime')
const bodyParser = require('body-parser')
const fs = require('fs');
const csv = require('csv-parser');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const cors = require('cors')
const sqlite3 = require('sqlite3')
const { open } = require("sqlite");
const path = require('path');
const dbPath = path.join(__dirname, 'school-payment.db')
let dataBase = null;
const serverInstance = express()
serverInstance.use(bodyParser.json());
serverInstance.use(bodyParser.urlencoded({ extended: true }));
serverInstance.use(express.json())
serverInstance.use(cors())
const Port = process.env.PORT || 4000

const initializeDatabaseSever = async() => {
    try {
        dataBase = await open({
            filename:dbPath,
            driver:sqlite3.Database
        })
        serverInstance.listen(Port, ()=>{
            console.log(`Date Time: ${dateTime()}, Server is running on the PORT:- http://localhost:${Port}`)
        })
        console.log('Database initialized:', dataBase)

        
    } catch (error) {
        console.log(`Database Error: ${error}`)
        process.exit(1);
    }
}
initializeDatabaseSever()

const rows = [];
fs.createReadStream('data.csv')
.pipe(csv())
.on('data', (row)=>{
    rows.push(row)
})
.on('end', async()=>{
    try {
        const checkTransaction = await dataBase.get('SELECT COUNT(*) AS count FROM "transaction"');
        console.log(checkTransaction.count)
        if(checkTransaction.count === 0){
            for (let index=0; index<rows.length; index++){
                const data = rows[index]
                await dataBase.run(
                    'INSERT INTO "transaction" (collect_id, school_id, gateway, order_amount, transaction_amount, status, custom_order_id, date) VALUES (?,?,?,?,?,?,?,?)',
                    [data.collect_id, data.school_id, data.gateway, data.order_amount, data.transaction_amount, data.status, data.custom_order_id, data.date]
                )}}
                else{
                    console.log('Insert of the data in transaction table in completed. No duplicate entries allowed..!')
                }} 
                catch (error) {
                    console.log(`Error occure while inserting or importing data: ${error.message}`)
                }
})
.on('error', (error)=>{
    console.error('An error occurred while importing data:', error.message);
})

// Token Authorization (Middleware Function)
const authenticateToken  = (request, response, next) => {
    let jwtToken;
    const authHeaders = request.headers['authorization'];
    if (!authHeaders) return response.status(401).json({error:"Authorization header missing..!"});
    jwtToken = authHeaders.split(' ')[1];
    if (!jwtToken) return response.status(401).json({error:"Unauthorized Access Token..!"});
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async(error, payload)=>{
        if (error) return response.status(403).json({error:"Invalid Token"});
        request.email = payload.email
        next()
    })
}


// user regisration
serverInstance.post('/registration', async(request, response)=>{
    const {name, email, password} = request.body
    try {
        if (!name || !email || !password) return response.status(400).json({error:'All correct user details are mandatory to give..!'})
        const userCredentials = {user_name:name, user_email:email, user_password:password}
        const {error} = checkUserCredentials.validate(userCredentials)
        if (error) return response.status(400).json({error:`${error.details[0].message}`})
        const isUserExist = await dataBase.get('SELECT * FROM user WHERE email = ?', [email])
        if (isUserExist) return response.status(400).json({error:`User ${isUserExist.email} already exist..!`})
        const hasedPassword = await bcrypt.hash(password, 10)
        await dataBase.run('INSERT INTO user(id, name, email, password, register_time) VALUES(?,?,?,?,?)', [uuidv4(), name, email, hasedPassword, dateTime()])
        return response.status(200).json({ message: 'User registered successfully..!' });
    } catch (error) {
        response.status(500).json({error:`${error.message}`})   
    }
})

// User Login 
serverInstance.post('/login', async(request, response)=>{
    const {email, password} = request.body
    try {
        if (!email || !password) return response.status(400).json({error:'Correct email and password both are mandatory..!'})
        const userLoginCredential = {user_email:email, user_password:password}
        const {error} = checkUserLoginCredentials.validate(userLoginCredential)
        if (error) return response.status(400).json({error:`${error.details[0].message}`})
        const checkLoginUser = await dataBase.get('SELECT * FROM user WHERE email = ?', [email])
        if (!checkLoginUser) return response.status(400).json({error:'Invalid user login email..!'})
        const checkPassword = await bcrypt.compare(password, checkLoginUser.password)
        if (checkPassword){
            await dataBase.run('UPDATE user SET login_time = ? WHERE email = ?', [dateTime(), checkLoginUser.email])
            const payload = {email: checkLoginUser.email}
            const jwtToken = jwt.sign(payload, 'MY_SECRET_TOKEN')
            const tokenDetail = {jwt_token:jwtToken}
            response.status(200).json(tokenDetail)
            console.log({jwt_token:jwtToken})
        }
        else{
            response.status(400).json({error:"Invalid user login passowrd..!"})
        }
        }
     catch (error) {
        response.status(500).json({error:`Error while login: ${error.message}`})
    }}
)

// Fetch all Transactions
serverInstance.get('/transaction', authenticateToken, async(request, response)=>{
    const {status, startDate, endDate, pageNo} = request.query
    try {
        const limit = 5
        const offset = limit * (pageNo?pageNo-1:0)
        let query = `SELECT * FROM "transaction"`
        const conditions = [];
        const parameters = [];
        if (status && ['Pending','Success','Failed'].includes(status)){
            conditions.push(`status = ?`);
            parameters.push(status)
        }
        if (startDate && endDate) {
            conditions.push(`date BETWEEN ? AND ?`);
            parameters.push(startDate, endDate);
        }
        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(' AND ') + ` LIMIT ${limit} OFFSET ${offset}`;
        }
        else{
            query+=` LIMIT ${limit} OFFSET ${offset}`
        }
        const transactions = await dataBase.all(query, parameters);
        response.status(200).json({ transactions });
    } catch (error) {
        response.status(500).json({error:`Error: ${error.message}`})
    }

})

// Fetch Transactions by School 
serverInstance.get('/transaction/school/:schoolId', authenticateToken, async(request, response)=>{
    const {schoolId} = request.params
    try {
        if (schoolId){
            const transaction = await dataBase.all('SELECT * FROM "transaction" WHERE school_id = ?', [schoolId])
            if (!transaction) return response.status(400).json({error:'No data found according to parameter of school_id'})
            response.status(200).json({transaction})
        } 
    } catch (error) {
        response.status(500).json({error:`Error: ${error.message}`})
    }
})

//  Transaction Status Check
serverInstance.get('/transactions/status/:orderId', authenticateToken, async(request, response)=>{
    const {orderId} = request.params
    console.log(orderId)
    try {
        if (orderId){
            const transactionStatus = await dataBase.all('SELECT status FROM "transaction" WHERE custom_order_id = ?', [orderId])
            if (!transactionStatus) return response.status(400).json({error:"No status found..!"})
            response.status(200).json({transactionStatus})
        }
        
    } catch (error) {
        response.status(500).json({error:`Error: ${error.message}`})
    }
})

// Status Update 
serverInstance.put('/transactions/status-update/:id', authenticateToken, async(request, response)=>{
    const {email} = request
    const {id} = request.params
    const {status} = request.query
    try {
        if (id && ['Pending','Success','Failed'].includes(status) && email){
            await dataBase.run(`UPDATE "transaction" SET status = ?, date = ?, user_id = (SELECT id FROM user WHERE email = ?) WHERE id = ?`, [status, date(), email, id])
            response.status(200).json('status updated successfully..!')
        }  
    } catch (error) {
        response.status(500).json({error:`Error: ${error.message}`}) 
    }
})