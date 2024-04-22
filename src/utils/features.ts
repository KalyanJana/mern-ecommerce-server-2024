import mongoose, { Document } from "mongoose"
import { myCache } from "../app.js"
import { Product } from "../models/product.js"
import { InvalidateCacheProps, OrderItemType } from "../types/types.js"
import { Order } from "../models/order.js"
import { User } from "../models/user.js"


export const connectDB = (MONGO_PROD_URL: string) =>{
    mongoose
    .connect(MONGO_PROD_URL,{
        dbName: "Ecommerce_24",
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
    })
    .then(c=>console.log(`DB connected to ${c.connection.host}`))
    .catch(e=>console.log(e))
}


export const invalidatesCache =  async({
    product, 
    order, 
    admin, 
    userId,
    orderId,
    productId,
    }: InvalidateCacheProps) =>{

    if(product){
        const productKeys : string[] =[
            'all-products',
            'categories',
            'latest-products',
        ]

        if(typeof productId === 'string'){
            productKeys.push(`product-${productId}`)
        }
        //for arrray of product id
        if(typeof productId === 'object'){
            productId?.forEach(i=>productKeys.push(`product-${i}`))
        }

        myCache.del(productKeys)
    }
    if(order){

        const ordersKeys: string[] =[
            "all-orders", 
            `my-order-${userId}`,
            `order-${orderId}`
        ]

        myCache.del(ordersKeys)
    }
    if(admin){
        myCache.del(["admin-stats","admin-pie-charts","admin-bar-charts","admin-line-charts"])
    }

}



export const reduceStock = async(orderItems: OrderItemType[]) =>{
    for(let i=0; i<orderItems.length; i++){
        const order = orderItems[i]
        const product = await Product.findById(order.productId)

        if(!product) throw new Error("Product Not Found!")
        
        product.stock -= order.quantity
        await product.save()
    }
}

export const calculatePercentage = (thisMonth: number, lastMonth: number) =>{

    if(lastMonth ===0) return Number(thisMonth *100)

    const percent = (thisMonth)/lastMonth *100

    return Number(percent.toFixed(0))
}

export const getInventories = async(
    {
        categories,
        productsCount
    }
    : 
    {
        categories:string[], 
        productsCount: number
    }) =>{

    const categoriesCountPromise = categories.map(category=>
        Product.countDocuments({category})
    )

    const categoriesCount = await Promise.all(categoriesCountPromise)

    const categoryCount: Record<string, number>[] = []

    console.log("categories", categoriesCount)
    categories.forEach((category,i)=>{
        categoryCount.push({
            [category]: Math.round((categoriesCount[i]/productsCount) * 100)
        })
    })

    return categoryCount
}

interface MyDocument extends Document {
    createdAt: Date,
    discount?: number,
    total?: number,
}

type FuncProps ={
    length: number, 
    docArr:MyDocument[],
    today: Date,
    property?: "discount" | "total",
}

export const getChartData = ({length, docArr, today, property}: FuncProps) =>{

    const data = new Array(length).fill(0)

        docArr.forEach(i=>{
            const creationDate = i.createdAt
            const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12

            if(monthDiff< length){
                data[length - monthDiff - 1] += property ? i[property]! : 1
            }
        })

        return data
}














// import mongoose from "mongoose";

// export const connectDatabase = async () => {
//   try {
//     const mongoURL =
//       process.env.MOD_ENV === "Devlopment"
//         ? process.env.MONGO_TEST_URL
//         : process.env.MONGO_PROD_URL;
//     const dbName = process.env.MOD_ENV === "Devlopment" ? "myportfolio" : "myportfolio";

//     //connection to MongoDB
//     await mongoose.connect(mongoURL, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       dbName: dbName,
//     });

//     //connection established
//     console.log("connected to MongoDB");

//     //Event handlers for the database connection
//     mongoose.connection.on("error", (error) => {
//       console.log("MongoDB connection error :", error);
//     });

//     mongoose.connection.on("disconnected", () => {
//       console.log("MongoDB disconnected");
//     });

//     //Gracefully handle process termination
//     process.on("SIGNIT", async () => {
//       try {
//         await mongoose.connection.close();
//         console.log("MongoDB connection closed");
//         process.exit(0);
//       } catch (error) {
//         console.log("Error closing MongoDB connection :", error);
//         process.exit(1);
//       }
//     });
//   } catch (error) {
//     console.log("Connection error in MongoDB data base :", error);
//     process.exit(1);
//   }
// };
