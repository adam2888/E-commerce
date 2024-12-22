import express from 'express';
import client from './db.js';



const app = express();
const PORT = 5500; 

app.get('/', (req, res) => {s
    res.send('Hello, World!');
});

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


