import express from 'express';
import client from './db.js';
import bcrypt from 'bcrypt';
import passport from './passport.js';
import session from 'express-session';
import dotenv from 'dotenv'; 
dotenv.config();
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json' assert { type: 'json' };

const saltRounds = 10; // Number of rounds for hashing

const app = express();
const PORT = 5500; 






app.use(express.json());


const sessionSecret = process.env.Session_Secret;
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false
})
);

app.use(passport.initialize());
app.use(passport.session());

/**
 * @swagger
 * /api/hello:
 *   get:
 *     description: Get a hello message
 *     responses:
 *       200:
 *         description: Success
 */

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));



app.post('/login', (req,res,next) => {

  const { username, password } = req.body; // create username and password variables from request body.

  if (!username || !password) { //Check they are prsent
    return res.status(400).json({ message: 'Username and password are required' });
  }



  passport.authenticate('local',(err,user,info) => {

    if(err){ 
      return res.status(500).json({message:'An error has occured'});
    }
    if(!user){
      return res.status(401).json({message:'Authentication failed',details: info.message});
    }

    req.logIn(user, (err) => {
      if(err){
        return res.status(500).json({message: 'An error occured while logging in',user});
      }
      return res.status(200).json({message:'Authentication successful', user})
    }) 
  }) (req, res, next);
})



//User Endpoints
//Get all users
app.get('/users',async (req,res) => {
  try{
    const results = await client.query('SELECT * FROM users')
    res.status(200).json(results.rows)
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({message: 'Error retrieving users'})
  }
})

//Get one specific user
app.get('/users/:id',async (req,res) => {
  const id = req.params.id;
  try{
    const results = await client.query('SELECT * FROM users WHERE id = $1', [id]);
    if (results.rows.length === 0) {
      return res.status(404).json({error:'No users with this id'})
    }
    res.json(results.rows)
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({message: 'Error retrieving users'})
  }
})

//Add User 
app.post('/register', async (req,res) => {

  const {email,password,name,username} = req.body;
  if(!username || !password){ // Check username and password are in the request body.
    return res.status(400).json({message:'Username and password are required'})
  }
  try {

   const existingUser = await client.query(
    'SELECT * FROM users WHERE username = $1',[username])
    if(existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'User already exists' }); // 409 Conflict
    }
    const hashedPassword = await bcrypt.hash(password,saltRounds)
    const results = await client.query(
    ` INSERT INTO users (name,email,password,username)
      VALUES ($1,$2,$3,$4)
    `,[name,email,hashedPassword,username])
    res.status(201).json({
      message:'New user added',
      user:results.rows[0]})
  } catch (error){
    console.error('Error adding user:',error)
    res.status(500).json({message:'Error adding user', error: error.message})
  }
})

//Edit User
app.put('/users/:id', async (req,res) => {
  const id = req.params.id;
  const {email,password,name,username} = req.body;
  let hashedPassword;

  if(password){
    hashedPassword = await bcrypt.hash(password,saltRounds);
  }
  
  try {
    const results = await client.query(
      `UPDATE users
        SET 
         name = COALESCE($1, name), 
         email = COALESCE($2, email), 
         password = COALESCE($3, password),
         username = COALESCE($4,username)
       WHERE id = $5`,[name,email,hashedPassword,username,id])

      if(results.rowCount === 0){
        return res.status(404).json({message:'User not found'})
      }
      res.status(200).json({message:'User updated successfully'})
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({message:'Error updating user'});
  }
});

//Delete User 
app.delete('/users/:id', async (req,res) => {
  const id = req.params.id;

try {
  const results = await client.query('DELETE FROM users WHERE id = $1', [id]);
  console.log("Rows affected:", results.rowCount)
  if(results.rowCount === 0){
    return res.status(404).json({message:'User not found'});
  }
  res.status(200).json({message:'User deleted successfully'});
} catch (error) {
  console.error('Error deleting user:', error);
 res.status(500).json({message:'User not deleted'})
}
})



//Products Endpoints
// Get all products
app.get('/products', async (req, res) => {
  try{
  const result = await client.query('SELECT * FROM products')
  res.status(200).json(result.rows);
 } catch (error) {
  console.error('Error retrieving products:', error);
  res.status(500).json({message:'Error retrieving products'});
 }
})

// Get one specific product 
app.get('/products/:id', async (req,res) => {
  const productId = req.params.id;
  try{
    const result = await client.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (result.rows.length === 0) {
      return res.status(404).json({error:"product not found"});
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error retrieving products:', error);
    res.status(500).json({message: 'Error retrieving products'});
}
})

// Get list of objects based on categories 
app.get('/products/category/:category', async (req,res) => {
  const category = req.params.category.charAt(0).toUpperCase() + req.params.category.slice(1).toLowerCase();
 try{
  const results = await client.query('SELECT * FROM products WHERE category = $1', [category]);
  if(results.rows === 0){
    return res.status(404).json({message:'No products found'})
  }
  res.json(results.rows)
 } catch (error){
  console.error('Error retrieving products:', error);
  res.status(500).json({message: 'Error retrieving products'});
 }
});

//Add Product
app.post('/products', async (req,res) => {

  const {name,description,price,stock,category} = req.body;
  try {
    const results = await client.query(
    ` INSERT INTO products (name,description,price,stock,category)
      VALUES ($1,$2,$3,$4,$5)
    `,[name,description,price,stock,category])
    res.status(201).json({message:'New product added'})
  } catch (error){
    console.error('Error adding user:',error)
    res.status(500).json({message:'Error adding product', error: error.message})
  }

})

//Update a Product 
app.put('/products/:id', async (req,res) => { //When a user navigates to this path with a put request.
  const id = req.params.id; // The id in the url will be saved to the id variable.
  const {name,description,price,stock,category} = req.body; // Through destructing the variables are created from information in the body. The variables names must be the same as keys in the request body.
  try { // Try statement
    const results = await client.query( //await used to halt the process until the information is receivied or an error occurs. The following query will be sent to the database. COALESCE will try the first value, if it is null it will try the second value. In this case the first value could be a new value if it is not present (null) the orginial value will used. 
      `UPDATE products 
        SET 
         name = COALESCE($1, name),
         description = COALESCE($2, description), 
         price = COALESCE($3, price),
         stock = COALESCE($4, stock) ,
         category = COALESCE($5, category) 
       WHERE id = $6`,[name,description,price,stock,category,id]) // Will replace the placeholders. The first value in the array will replace $1, the second $2 and so on.

      if(results.rowCount === 0){ // If the number of rows that match the WHERE (in this case id) is 0 this code will run. Exit on return. 
        return res.status(404).json({message:'Product not found'}) // 404 status is missing resource. 
      }
      res.status(200).json({message:'Product updated successfully'}) // If item is found and updated send 200status and success message.
  } catch (error) { // If an error console error along with send a respose with a 500 status and an error message. 
    console.error('Error updating product:', error);
    res.status(500).json({message:'Error updating product'});
  }
});



//Delete product
app.delete('/products/:id', async (req,res) => {
  const id = req.params.id;
try {
  const results = await client.query('DELETE FROM products WHERE id = $1', [id]);
  console.log("Rows affected:", results.rowCount)
  if(results.rowCount === 0){
    return res.status(404).json({message:'Product not found'});
  }
  res.status(204).json({message:'Product deleted successfully'});
} catch (error) {
  console.error('Error deleting product:', error);
 res.status(500).json({message:'Product not deleted'})
}
})



//Order Endpoints
//Get all orders

app.get('/orders', async (req, res) => {
  try{
  const results = await client.query('SELECT * FROM orders')
  res.status(200).json(results.rows);
 } catch (error) {
  console.error('Error retrieving orders:', error);
  res.status(500).json({message:'Error retrieving orders'});
 }
});

//Get one specific order
app.get('/orders/:id', async (req,res) => {
  const orderId = req.params.id;
  try{
    const result = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (result.rows.length === 0) {
      return res.status(404).json({error:"order not found"});
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error retrieving order:', error);
    res.status(500).json({message: 'Error retrieving order'});
}
})

//Get order based on status
app.get('/orders/status/:status', async (req,res) => {
  const status = req.params.status.toLowerCase();
 try{
  const results = await client.query('SELECT * FROM orders WHERE status = $1', [status]);
  if(results.rows === 0){
    return res.status(404).json({message:'No orders found'})
  }
  res.json(results.rows)
 } catch (error){
  console.error('Error retrieving orders:', error);
  res.status(500).json({message: 'Error retrieving orders'});
 }
});

//Cart Endpoints
// Get users Cart 
app.get('/cart/:user_id', async (req,res) => {
 const user_id = req.params.user_id
 const userExists = await client.query('SELECT * FROM users WHERE id = $1',[user_id])
 if(userExists.rows.length === 0){
  return res.status(404).json({message:'User does not exist'})
 }
 try{
  const results = await client.query('SELECT * FROM carts WHERE user_id = $1', [user_id]);
  if(results.rowCount === 0){
    return res.status(404).json({message:'User does not have a cart'})
  }
  return res.status(200).json(results.rows[0]);
 }catch(error){
  console.error('Error retrieving cart:', error);
  return res.status(500).json({message: 'Error retrieving cart'});
 }
})

//Add item to Cart 
app.post('/cart/:user_id', async (req,res) => { 
const user_id = req.params.user_id; // extract user_id
const {productId,quantity} = req.body; //extract productId,quantity

if(!productId || !quantity){// Check if productID and quantity have been provided
  return res.status(400).json({message:'Product ID and Quantity required '})
}


const checkUserExists = await client.query('SELECT * FROM users WHERE id = $1', [user_id])

if (checkUserExists.rows.length === 0){
  return res.status(400).json({message:"User does not exist"});
}


try{
let result = await client.query('SELECT * FROM carts WHERE user_id = $1', [user_id]) //Check if user has a cart
if(result.rows.length === 0){
  result = await client.query('INSERT INTO carts (user_id) VALUES ($1)', [user_id]) // If they don't create them one.
}

const cartId = result.rows[0].id; // extract the cart_id

let cartItem = await client.query('SELECT * FROM cart_Items WHERE cart_id = $1 AND product_id = $2', [cartId,productId]); //Check if the product is already in the users cart.

if(cartItem.rows.length > 0) { //If it is we update the quantity of the item rather than adding in a new item. 
  await client.query('UPDATE cart_items SET quantity = quantity + $1 WHERE cart_id = $2 AND product_id = $3', [quantity,cartId,productId])
  return res.status(200).json({message:'Product quantity updated to cart'})
}

//At this point we know the user has a cart and the product is not in it. The query adds the products into the cart. 
await client.query('INSERT into cart_items (cart_id,product_id,quantity) VALUES ($1,$2,$3)',[cartId, productId,quantity]);
return res.status(201).json({message:'Product added to cart '});
} catch (error){
  console.error('Error adding product to cart:', error);
  res.status(500).json({ message: 'Error adding product to cart' });
}
})

//Delete an item from the cart 
app.delete('/cartItem/:cartId/:productId', async (req,res) => {
const {cartId,productId} = req.params;
if (!cartId || isNaN(parseInt(cartId)) || !productId || isNaN(parseInt(productId))){
  return res.status(400).json({message:"Cart Id and Product Id must be provided"})
}
try {
const results = await client.query('DELETE FROM cart_items WHERE product_id = $1 AND cart_id = $2', [productId,cartId]);
if(results.rowCount === 0) {
 res.status(404).json({message:"Products not found"});
}

const remainingItems = await client.query('SELECT * FROM cart_items WHERE cart_id = $1', [cartId])
if(remainingItems.rows.length === 0){
  await client.query('DELETE FROM carts WHERE id = $1',[cartId])
}

res.status(200).json({message:"Item deleted from basket"})
} catch (error){
console.error(error)
res.status(500).json({message:"Server Error"});
}
})



//Checkout Enpoint
app.post('/cart/:cartId/checkout', async (req,res)  => {

const cartId = req.params.cartId;

const cartExists = await client.query('SELECT * from carts WHERE id = $1', [cartId]);

  if(cartExists.rows.length === 0){
   return res.status(400).json({message:'Cart not found'})
   }

  try {
    const results = await client.query(
      'Select  p.name, ci.quantity, p.price, ci.quantity * p.price AS total_price FROM cart_items AS ci JOIN products AS p ON ci.product_id = p.id WHERE ci.cart_id = $1', [cartId]
    );
    if (results.rows.length === 0) {
      return res.status(404).json({ message: 'No items in the cart' });
    }

    const totalAmountResults = await client.query(
      'SELECT SUM(ci.quantity * p.price) AS total_amount FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = $1',
      [cartId] );
  

      if (totalAmountResults.rows.length === 0 || totalAmountResults.rows[0].total_amount == null) {
        return res.status(400).json({ message: "Could not calculate total amount" });
      }
    
      //Ensure total_amount is a valid number and format it to 2 decimal places

     

      const totalAmount = parseInt(totalAmountResults.rows[0].total_amount); // Example number
      console.log(typeof totalAmount);  // Should be 'number'
      const formattedAmount = totalAmount.toLocaleString('en-GB', {
          style: 'currency',
          currency: 'GBP'
      }); 
   
      // Return the formatted totalAmount
      return res.status(200).json({'Total Amount': formattedAmount})
  

  } catch (error){

    return res.status(500).json({message:"Internal Error"})
  }
}) 








app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


