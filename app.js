const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const _ = require('lodash')
const dotenv = require("dotenv");
dotenv.config();

app.set('view engine', 'ejs') // setting view engine to ejs
app.use(bodyParser.urlencoded({ extended: true })) // for accessing nested objs
app.use(express.static('public')) // access local file on public dir

// mongoose set up 
const mongoose = require('mongoose') // require mongoose
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('connected to db');
    })
    .catch((err) => {
        console.log(err.message);
    });

app.use(express.urlencoded({extended:true}))

// Schema
const itemSchema = (
    {
        name: String
    }
)
// Model
const Item = mongoose.model('Item', itemSchema)

// creating objs

const item1 = new Item(
    { name: 'Welcome to your todo list!' }
)
const item2 = new Item(
    { name: 'Hit the + button to add a new item.' }
)
const item3 = new Item(
    { name: '<-- Hit this to delete an item!' }
)

const defaultItems = [item1, item2, item3] // storing 3 default msg to this array

// add this to item model inside todolistDB data resides inside items collection as an array
/*

*/

// Creating new schema for custom list
const listSchema = {
    name: String,
    items: [itemSchema] // items based on itemSchema
}

// Creating model for custom List
const List = mongoose.model('Lists', listSchema)

app.get('/', function (req, res) {
    // Read data
    Item.find({}, function (err, items) { // param 1 = error, param 2 = collection name
        if (items.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('data added successfully');
                }
            })
            res.redirect('/') // after adding 3 default items redirects to home
        } else {
            res.render('list', { listTitle: 'Today', listItems: items }) // sending 'Today' -> listTitle and items array -> listItems in list.ejs file
        }
    })
})

app.get('/:customListName', function (req, res) { // Creating custom lists
    const customListName = _.capitalize(req.params.customListName) // :listName entered by user

    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (!foundList) { // no list found
                // Create new list
                const list = new List({ // creating new List object
                    name: customListName,
                    items: defaultItems // passoing default items array as items
                })
                list.save() // saving this new list
                res.redirect('/' + customListName) // after creating redirects to newly created route
            }
            else {
                // Render existing list
                res.render('list', { listTitle: foundList.name, listItems: foundList.items })
            }
        }
    })
})

app.post('/', function (req, res) { // catch post request from html form
    const itemName = req.body.newItem
    const listName = req.body.titleName
    const item = new Item({ // create new object new task name
        name: itemName
    })
    if (listName === 'Today') { // if its '/' route

        item.save() // save it to db
        // or in a short form
        // Item.create({ name: itemName }) // create and add new task name to db
        res.redirect('/') // redirects to home route
    }
    else { // if its '/topicName' route
        List.findOne({ name: listName }, function (err, foundList) { // returning foundList containing '/name'
            foundList.items.push(item), // pushing task name(item) to foundList items array
            foundList.save() // saving all of it
            res.redirect('/' + listName)
        })
    }

})

app.post('/delete', function (req, res) { // catching checkbox form req
    const itemId = (req.body.check).trim() // name="check" value = "<%= item.id %>"
    const listName = (req.body.listName).trim() // there may be blank space before id/name
    if (listName === 'Today') {
        Item.findByIdAndRemove(itemId, function (err) { // method name says it all
            if (!err) {
                // console.log('deleted items success');
                
                res.redirect('/');
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: itemId } } }, function (err, foundList) {
            if (!err) {
                res.redirect('/' + listName);
            }
        });
    }

});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
    console.log('app running on port 3000');
})
