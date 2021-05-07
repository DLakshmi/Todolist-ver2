const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true,useUnifiedTopology: true});

const itemSchema = {
  name: String
};
//for customListName creating schema and model
const listSchema ={
  name : String,
  items : [itemSchema]
};

const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);


const item1 = new Item({
  name: "learn today"
});
const item2 = new Item({
  name: "practice"
});
const item3 = new Item({
  name: "create website"
});

const defaultItems = [item1, item2, item3];

const myDateString = Date().slice(0,15);

app.get("/", function(req, res) {
  //const day = date.getDate();
  Item.find({}, function(err, foundItems) {

    if (foundItems.length == 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("successfully saved defaultItems to db");
          }
          res.redirect("/");
        });
      } else {
      res.render("list", {listTitle: myDateString,newListItems: foundItems});
      }
  });
});
app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });
  if(listName === myDateString){
    newItem.save();
    res.redirect("/");
  }else{
    List.findOne({name : listName}, function(err, foundresult){
      foundresult.items.push(newItem); //js to push nu array
      foundresult.save();
      res.redirect("/"+ listName);
    });
  }
});

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.hiddenListName;

  if(listName === myDateString){
    Item.deleteOne({_id : req.body.checkbox}, function(err){
      if (!err) {
        console.log("deleted successfully");
        res.redirect("/");
      }
    });
  }else{
    //List.findOneAndUpdate({condition},{condition->{$pull : query->key:value}},callback function)
    List.findOneAndUpdate({name: listName},{$pull : {items : {_id : checkedItemId}}}, {useFindAndModify: false},function(err,foundlist){
      if (!err) {
        res.redirect("/"+listName);
      }
    });
  }

});

// customlist name creating , refer List model and listSchema
app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);
   List.findOne({name : customListName}, function(err, foundresult){
     if(!err){
       if(!foundresult){//if list exists
         const list = new List ({
           name : customListName,
           items : defaultItems
         });
           list.save();
           res.redirect("/" + customListName);
         }
         else{
           res.render("list", {listTitle: foundresult.name, newListItems: foundresult.items});
         }
     }
  });
});




app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
