let express=require('express');
let app=express();
let dotenv=require('dotenv');
dotenv.config();
// let port=9800;
let morgan=require('morgan');
let fs=require('fs');
let port=process.env.PORT||9800;
let cors=require('cors');
let mongo=require('mongodb');
const { query } = require('express');
let MongoClient=mongo.MongoClient;
// let mongoUrl=process.env.MongoLocal;
let mongoUrl="mongodb+srv://shan:shan123@cluster0.4g8rx1o.mongodb.net/Lifestyle?retryWrites=true&w=majority";
let bodyParser=require('body-parser')
let db;
// app.use(morgan('tiny'));

// middleware
app.use(morgan('short',{stream:fs.createWriteStream('./app.logs')}))
app.use(cors());
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())

app.get('/',(req,res)=>{
    res.send('<h1>This is from express</h1>');
})

app.get('/listing/:Subcategoryid',(req,res)=>{
    let query={};
    let Subcategoryid=Number(req.params.Subcategoryid)
    let Shoptypeid=Number(req.query.Shoptypeid)
    let Brandsid=Number(req.query.Brandsid)
    if(Shoptypeid)
    {
        query={
            "Subcategory_id":Subcategoryid,
            "Shoptype_id":Shoptypeid,
            // "Brands_id":Brandsid
        }
    }
    else {
        query = {
            Subcategory_id:Subcategoryid
        }
    }
    db.collection('products').find(query).toArray((err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})
// To see brands wrt subcategory
app.get('/Brands/:Subcategoryid',(req,res)=>{
    let query={};
    let Subcategoryid=Number(req.params.Subcategoryid)
    let Brandsid=Number(req.query.Brandsid)
    if(Brandsid)
    {
        query={
            "Subcategory_id":Subcategoryid,
            "Brands_id":Brandsid
        }
    }
    else {
        query = {
            Subcategory_id:Subcategoryid
        }
    }
    db.collection('products').find(query).toArray((err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})

// List of products wrt brands and subcategory
app.get('/listing/:Subcategoryid/:Shoptypeid',(req,res)=>{
    let query={};
    let Subcategoryid=Number(req.params.Subcategoryid)
    let Shoptypeid=Number(req.params.Shoptypeid)
    let Brandsid=Number(req.query.Brandsid)
    if(Brandsid)
    {
        query={
            "Subcategory_id":Subcategoryid,
            "Shoptype_id":Shoptypeid,
            "Brands_id":Brandsid
        }
    }
    else {
        query = {
            "Subcategory_id":Subcategoryid,
            "Shoptype_id":Shoptypeid,
        }
    }
    db.collection('products').find(query).toArray((err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})

// Sort by cost wrt category
app.get('/filter/:Subcategoryid/:Shoptypeid',(req,res)=>{
    let query={};
    let sort={new_price:1}  //ASc order
    let Subcategoryid=Number(req.params.Subcategoryid)
    let Shoptypeid=Number(req.params.Shoptypeid)
    let Brandsid=Number(req.query.Brandsid)
    let lcost=Number(req.query.lcost)
    let hcost=Number(req.query.hcost)
    if(req.query.sort){
        sort={new_price:req.query.sort}
    }
    if(Brandsid&&lcost&&hcost){
        query = {
            "Subcategory_id":Subcategoryid,
            "Shoptype_id":Shoptypeid,
            "Brands_id":Brandsid,
            new_price:{$gt: lcost, $lt: hcost}
        }
    }
    else if(lcost&&hcost){
        query = {
            "Subcategory_id":Subcategoryid,
            "Shoptype_id":Shoptypeid,
            new_price:{$gt: lcost, $lt: hcost}
        }
    }
    else{
    query={
        "Subcategory_id":Subcategoryid,
        "Shoptype_id":Shoptypeid
    }
    }
    db.collection('products').find(query).sort(sort).toArray((err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})

// Discount
app.get('/filter/discount/:Subcategoryid/:Shoptypeid/:dis',(req,res)=>{
    let query={};
    let Subcategoryid=Number(req.params.Subcategoryid)
    let Shoptypeid=Number(req.params.Shoptypeid)
    // let discount=Number(req.query.discount)
    let discount = req.params.dis;

    query = {discount:{$gt: Number(discount)}};
    db.collection('products').find(query).toArray((err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})

// Rating
app.get('/filter/rating/:Subcategoryid/:Shoptypeid/:rate',(req,res)=>{
    let query={};
    let Subcategoryid=Number(req.params.Subcategoryid)
    let Shoptypeid=Number(req.params.Shoptypeid)
    let rating = req.params.rate;

    query = {hidden_stars:{$gt: Number(rating)}};
    db.collection('products').find(query).toArray((err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})

// Add to cart item
app.post('/cart/add',(req,res)=>{
    let shoptype=req.body.Shoptype;
    let itemid=req.body.item_id;
    let name=req.body.name;
    let email=req.body.email;
    if(!shoptype||!itemid||!name||!email){
        res.send("Invalid input type");
    }
    else{
        let query={};
        query={email:email,item_id:itemid,name:name,Shoptype:shoptype};
        db.collection('cart').find(query).toArray((err,result)=>{
            if(result.length>0){
                res.send('Item already exist in cart');
            }
            else{
                db.collection('cart').insertOne(req.body,(err,result)=>{
                    if(err) throw err;
                    res.send('Item added')
                })
            }
        })
    }
})
// Delete items from cart
app.delete('/cart/delete/:email/:Shoptype/:item_id', (req,res) => {
    let email = req.params.email;
    let Shoptype = req.params.Shoptype;
    let item_id = Number(req.params.item_id);
    db.collection('cart').deleteOne({email:email, Shoptype: Shoptype, item_id:item_id}, (err, result) => {
        if(err) throw err;
        // res.send(result);
        if(Number(result.deletedCount) === 0) {
            res.send('No such item exists!');
        } else {
            res.send(`Item no: ${item_id}, type: ${Shoptype}, of user ${email} deleted !\n Delete Count: ${result.deletedCount}`)
        }
    })
})

//Fetch items from cart
app.get('/cart/get/:email',(req,res)=>{
    let email=req.params.email;
    let query={};
    query={email:email};
    db.collection('cart').find(query).toArray((err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})
//Add items to wishlist
app.post('/wishlist/add',(req,res)=>{
    let shoptype=req.body.Shoptype;
    let itemid=req.body.item_id;
    let name=req.body.name;
    let email=req.body.email;
    if(!shoptype||!itemid||!name||!email){
        res.send("Invalid input type");
    }
    else{
        let query={};
        query={email:email,item_id:itemid,name:name,Shoptype:shoptype};
        db.collection('wishlist').find(query).toArray((err,result)=>{
            if(result.length>0){
                res.send('Item already exist in cart');
            }
            else{
                db.collection('wishlist').insertOne(req.body,(err,result)=>{
                    if(err) throw err;
                    res.send('Item added')
                })
            }
        })
    }
})

// Delete items from wishlist
app.delete('/wishlist/delete/:email/:Shoptype/:item_id', (req,res) => {
    let email = req.params.email;
    let Shoptype = req.params.Shoptype;
    let item_id = Number(req.params.item_id);
    db.collection('wishlist').deleteOne({email:email, Shoptype: Shoptype, item_id:item_id}, (err, result) => {
        if(err) throw err;
        // res.send(result);
        if(Number(result.deletedCount) === 0) {
            res.send('No such item exists!');
        } else {
            res.send(`Item no: ${item_id}, type: ${Shoptype}, of user ${email} deleted !\n Delete Count: ${result.deletedCount}`)
        }
    })
})
// Fetch item from wishlist
app.get('/wishlist/get/:email',(req,res)=>{
    let email=req.params.email;
    let query={};
    query={email:email};
    db.collection('wishlist').find(query).toArray((err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})
//Detail page
app.get('/product/category/subcategory/:Subcategoryid/:Shoptypeid',(req,res)=>{
    let query={};
    let Subcategoryid=Number(req.params.Subcategoryid)
    let Shoptypeid=Number(req.params.Shoptypeid)
    let item = Number(req.query.item);

    query = {
        item_id: Number(item)
    }
    db.collection('products').find(query).toArray((err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})
// Places order
app.post('/placeorder',(req,res)=>{
    console.log(req.body);
    db.collection('Orders').insert(req.body,(err,result)=>{
        if(err) throw err;
        res.send('Order Placed');
    })
})
// List of orders
app.get('/Orders',(req,res)=>{
    let query={};
    let email=req.query.email;
    if(email){
        query={email};
    }
    db.collection('Orders').find(query).toArray((err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})

// Update Order
app.put('/updateorder/:id',(req,res)=>{
    let oid=Number(req.params.id);
    db.collection('Orders').updateOne(
        {order_id:oid},
        {
            $set:{
                "Transaction_status":req.body.Transaction_status,
                "bank_name":req.body.bank_name,
                "date":req.body.date
            }
        },(err,result)=>{
            if(err) throw err;
            res.send('Order Updated')
        }
    )
})

// Delete Order
app.delete('/deleteorder/:id',(req,res)=>{
    let _id=mongo.ObjectId(req.params.id);
    db.collection('Orders').deleteOne({_id},(err,result)=>{
        if(err) throw err;
        res.send('Order Deleted');
    })
})
// Connection with mongo
MongoClient.connect(mongoUrl,(err,client)=>{
    if(err) console.log("Error while connecting");
    db=client.db('Lifestyle')
    app.listen(port,()=>{
        console.log(`Listing port ${port}`)
    })
})

