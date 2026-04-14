/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3414089001")

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "json4245322382",
    "maxSize": 0,
    "name": "customActivities",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3414089001")

  // remove field
  collection.fields.removeById("json4245322382")

  return app.save(collection)
})
