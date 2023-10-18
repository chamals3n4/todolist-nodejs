import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// let items = [];
// let workItems = [];
// let lastDate;

mongoose.connect("mongodb+srv://chamalsena:admin@cluster0.vpsymia.mongodb.net/todo-list",{useNewUrlParser : true});

const itemSchema = {
  name : String
};
const Item = mongoose.model("Item",itemSchema);
const item1 = new Item({
  name : "welcome to the to-do list"
});
const item2 = new Item({
  name : "hit the + btn an add the new item"
});
const item3 = new Item({
  name : "<-- hit this to delete and item"
});
const defaultItems = [item1, item2, item3];

const listSchema = {
  name : String,
  items : [itemSchema]
};

const List = mongoose.model("List",listSchema);

app.get("/", async (req, res) => {
  try {
    const foundItems = await Item.find({});

    if (foundItems.length === 0) {

      await Item.insertMany(defaultItems);
      res.redirect("/");
    } else {
      res.render("index.ejs", { listTitle: "Today", newListItems: foundItems });
    }

    console.log("Here's the default items:", foundItems);
    // Handle foundItems as needed
  } catch (err) {
    console.error(err);
    // Handle the error and send an appropriate response
  }
});

app.get("/:customListName",async (req,res)=>{


  try {
    const customListName = _.capitalize(req.params.customListName);

    const foundList = await List.findOne({name:customListName});
  
    if (!foundList) {
      //create a new list
      const lIst = new List({
        name : customListName,
        items:defaultItems
      });
      lIst.save();
      res.redirect("/"+customListName);
    }else{
      //show an existing list
      console.log("exist !");
      res.render("index.ejs",{ listTitle: foundList.name, newListItems: foundList.items })
    }
  } catch (err) {
    console.log(err)
  }

})

app.post("/", async (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  if (listName === "Today") {
    const item = new Item({
      name: itemName,
    });

    item.save();
    res.redirect("/");
  } else {
    try {
      const foundList = await List.findOne({ name: listName });

      if (foundList) {
        const item = new Item({
          name: itemName,
        });

        foundList.items.push(item);
        await foundList.save();
        res.redirect("/" + listName);
      } else {
        // Handle the case when the custom list doesn't exist
        console.error("Custom list not found");
        res.status(404).send("Custom list not found");
      }
    } catch (err) {
      console.error(err);
      // Handle other potential errors and send an appropriate response
    }
  }
});





app.post("/delete", async (req, res) => {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    await Item.findByIdAndRemove(checkedItemID);
    console.log("Successfully deleted the item !");
    res.redirect("/");
  } else {
    try {
      const foundList = await List.findOne({ name: listName });
      if (foundList) {
        foundList.items.pull({ _id: checkedItemID }); // Use the pull method to remove the item by its ObjectId
        await foundList.save();
        res.redirect("/" + listName);
      } else {
        console.error("Custom list not found");
        res.status(404).send("Custom list not found");
      }
    } catch (error) {
      console.log(error);
    }
  }
});




app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
