import express from 'express';
import client from './db.js';



const app = express();
const PORT = 5500; 

app.get('/', (req, res) => {s
    res.send('Hello, World!');
});

app.use(express.json());

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
app.post('/users/', async (req,res) => {

  const {email,password,name} = req.body;
  try {
    const results = await client.query(
    ` INSERT INTO users (name, email,password)
      VALUES ($1,$2,$3)
    `,[name,email,password])
    res.status(201).json({message:'New user added'})
  } catch (error){
    console.error('Error adding user:',error)
    res.status(500).json({message:'Error adding user', error: error.message})
  }

})

//Edit User
app.put('/users/:id', async (req,res) => {
  const id = req.params.id;
  const {email,password,name} = req.body;
  try {
    const results = await client.query(
      `UPDATE users
        SET 
         name = COALESCE($1, name), 
         email = COALESCE($2, email), 
         password = COALESCE($3, password) 
       WHERE id = $4`,[name,email,password,id])

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
app.put('/products/:id', async (req,res) => {
  const id = req.params.id;
  const {name,description,price,stock,category} = req.body;
  try {
    const results = await client.query(
      `UPDATE products
        SET 
         name = COALESCE($1, name), 
         description = COALESCE($2, description), 
         price = COALESCE($3, price),
         stock = COALESCE($4, stock) ,
         category = COALESCE($5, category) 
       WHERE id = $6`,[name,description,price,stock,category,id])

      if(results.rowCount === 0){
        return res.status(404).json({message:'Product not found'})
      }
      res.status(200).json({message:'Product updated successfully'})
  } catch (error) {
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









app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


