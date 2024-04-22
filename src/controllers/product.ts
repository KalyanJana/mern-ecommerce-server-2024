import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import { Product } from "../models/product.js";
import ErrorHandler from "../utils/utility-class.js";
import { rm } from "fs";
import { BaseQuery, NewProductRequestBody, SearchRequestQuery } from "../types/types.js";
import { myCache } from "../app.js";
import {faker} from '@faker-js/faker'
import { invalidatesCache } from "../utils/features.js";


//Re-validate on New, update, delete product & on New Order
export const getLatestProducts = TryCatch(
    async(req, res, next)=>{
       
        let products
        // throw new ErrorHandler("adf")
        if(myCache.has("latest-products")) {
            products = JSON.parse(myCache.get("latest-products") as string)
        }else{
            products = await Product.find({}).sort({createdAt:-1}).limit(10)

            myCache.set("latest-products",JSON.stringify(products))
        }
        
        return res.status(201).json({
            success: true,
            products,
        })
    }
)

//Re-validate on New, update, delete product & on New Order
export const getAllCategories = TryCatch(
    async(req, res, next)=>{
       
        let categories

        if(myCache.has("categories")){
            categories = JSON.parse(myCache.get("categories") as string)
        }else{
            
            categories = await Product.distinct("category")
            myCache.set("categories", JSON.stringify(categories))
        }

        return res.status(201).json({
            success: true,
            categories,
        })
    }
)

//Re-validate on New, update, delete product & on New Order
export const getAdminProducts = TryCatch(
    async(req, res, next)=>{

        let products
       
        if(myCache.has("all-products")){
            products = JSON.parse(myCache.get("all-products") as string)
        }else{

            products = await Product.find({})
            myCache.set("all-products", JSON.stringify(products))
        }

        return res.status(201).json({
            success: true,
            products,
        })
    }
)

export const getSingleProduct = TryCatch(
    async(req, res, next)=>{
        
        let product

        const {id}= req.params

        if(myCache.has(`product-${id}`)){
            product = JSON.parse(myCache.get(`product-${id}`) as string)
        }else{
            product = await Product.findById(id)

            if(!product) return next(new ErrorHandler("Product not found", 404))
            
            myCache.set(`product-${id}`, JSON.stringify(product))
        }


        return res.status(201).json({
            success: true,
            product,
        })
    }
)

export const newProduct = TryCatch(
    async(req: Request<{},{},NewProductRequestBody>, res, next)=>{
        const { name, price, stock, category} = req.body
        const photo = req.file

        if(!photo) return next(new ErrorHandler("Please add photo",400))

        if(!name || !price || !stock || !category) {

            rm(photo.path, ()=>{
                console.log("Photo Deleted")
            })

            return next(new ErrorHandler("Please enter all fields",400))
        }

        const product = await Product.create({
            name, 
            price, 
            stock, 
            category: category.toLowerCase(),
            photo: photo?.path,
        })

        invalidatesCache({product: true, admin: true})

        return res.status(201).json({
            success: true,
            message: "Product Created Successfully!",
        })
    }
)

export const updateProduct = TryCatch(
    async(req, res, next)=>{

       
        const {id} =req.params

        const { name, price, stock, category} = req.body
        const photo = req.file

        const product = await Product.findById(id)

        if(!product) return next(new ErrorHandler("Invalid Product Id", 404))

        if(photo) {

            rm(product.photo!, ()=>{
                console.log("Old photo Deleted")
            })

            product.photo = photo.path
        }

        if(name) product.name= name
        if(price) product.price= price
        if(stock) product.stock= stock
        if(category) product.category= category

        await product.save()

        invalidatesCache({product: true, admin: true, productId: String(product._id)})

        return res.status(200).json({
            success: true,
            message: "Product updated Successfully!",
        })
    }
)

export const deleteProduct = TryCatch(
    async(req, res, next)=>{
        
        const {id}= req.params

        const product = await Product.findById(id)

        if(!product) return next(new ErrorHandler("Product not found", 404))

        rm(product.photo, ()=>{
            console.log("Product Photo Deleted")
        })

        await Product.findByIdAndDelete(id)

        invalidatesCache({product: true, admin: true, productId: String(product._id)})

        return res.status(201).json({
            success: true,
            message: "Product deleted successfully",
        })
    }
)

export const getAllProducts = TryCatch(
    async(req:Request<{},{},{},SearchRequestQuery>, res, next)=>{
       
        const {search, sort, category, price} = req.query

        const page = Number(req.query.page) || 1

        const limit = Number(process.env.PRODUCT_PER_PAGE) || 8

        const skip = (page -1) * limit

        const baseQuery: BaseQuery =  {}

        if(search) baseQuery.name = {
            $regex: search , //search the pattern
            $options: "i", //case insensitive
        }

        if(price) baseQuery.price = {$lte: Number(price),}

        if(category) baseQuery.category = category

        const productsPromise = Product.find(baseQuery)
            .sort(sort && { price: sort === "asc" ? 1 : -1})
            .limit(limit)
            .skip(skip)

        const [products, filteredOnlyProducts] = await Promise.all([
            productsPromise,
            Product.find(baseQuery)
        ])


        const totalPage = Math.ceil(filteredOnlyProducts.length /limit)

        return res.status(201).json({
            success: true,
            products,
            totalPage,
        })
    }
)

// //call this one to add the products except first 2
// const generateRandomsProducts = async(count: number =10) =>{
//     const products =[]

//     for(let i=0;i<count; i++){
//         const product ={
//             name: faker.commerce.productName(),
//             photo:"uploads\\c4cdf11f-cd5a-40b9-95a7-d9a8a765aea2.jpeg",
//             price: faker.commerce.price({min: 1500, max: 80000, dec:0}),
//             stock: faker.commerce.price({min:0, max: 100, dec:0}),
//             category: faker.commerce.department(),
//             createdAt: new Date(faker.date.past()),
//             updatedAt: new Date(faker.date.recent()),
//             _v:0,
//         }
//         products.push(product)
//     }

//     await Product.create(products)
//     console.log({success: true})
// }

// //call this one to delete the products except first 2
// const deleteRandomsProducts = async(count: number =10) =>{
//     const products = await Product.find({}).skip(2)

//     for(let i=0;i<products.length; i++){
//         const product = products[i]
//         await product.deleteOne()
//     }
//     console.log({success: true})
// }


 

