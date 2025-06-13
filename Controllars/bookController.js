// const Book = require('../Models/bookModel');
// const Category = require('../Models/categoryModel');
// const cloudinary = require('cloudinary').v2;



// // Upload utility
// const uploadImageToCloudinary = (fileBuffer) => {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       { folder: 'books', resource_type: 'image' },
//       (err, result) => {
//         if (err) return reject(err);
//         resolve({ url: result.secure_url, public_id: result.public_id });
//       }
//     );
//     stream.end(fileBuffer);
//   });
// };

// // Add Book




// exports.addBook = async (req, res) => {
//   try {
//     const { name, author, about, language, category } = req.body;
//     const files = req.files;

//     // Upload images to Cloudinary
//     // Upload images
// const uploadedImages = await Promise.all(
//   (files.images || []).map(file =>
//     cloudinary.uploader.upload(file.path, { folder: 'books/images' })
//   )
// );

// // Upload PDF
// const uploadedPdf = files.pdf?.[0];
// if (!uploadedPdf) {
//   return res.status(400).json({ message: "PDF file is required" });
// }

// const newBook = new Book({
//   name,
//   author,
//   about,
//   language,
//   categoryId: category,
//   images: uploadedImages,
//   pdf: {
//     data: require('fs').readFileSync(uploadedPdf.path),
//     contentType: uploadedPdf.mimetype,
//     originalName: uploadedPdf.originalname,
//   },
//   like: false,
//   isSubscribed: false,
// });

//     await newBook.save();

//     res.status(201).json({
//       message: '✅ Book added successfully',
//       book: newBook,
//     });

//   } catch (error) {
//     console.error("❌ Error adding book:", error);
//     res.status(500).json({ message: "❌ Failed to add book", error: error.message });
//   }
// };



// exports.getPdfByBookId = async (req, res) => {
//   try {
//     const book = await Book.findById(req.params.bookId);
//     if (!book || !book.pdf?.file) {
//       return res.status(404).json({ message: 'PDF not found' });
//     }

//     res.set({
//       'Content-Type': book.pdf.mimetype,
//       'Content-Disposition': `inline; filename="${book.pdf.filename}"`,
//     });

//     res.send(book.pdf.file);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch PDF', error: error.message });
//   }
// };


// // Get all books for a category
// exports.getBooksByCategory = async (req, res) => {
//   try {
//     const { categoryId } = req.params;
//     const subscribed = req.user?.subscribed;

//     const books = await Book.find({ categoryId }).sort({ createdAt: -1 }).populate('categoryId');

//     const updatedBooks = books.map(book => {
//       const bookObj = book.toObject();

//       // Add PDF URL only if subscribed
//       if (subscribed) {
//         bookObj.pdfUrl = `${req.protocol}://${req.get('host')}/books/pdf/${book._id}`;
//       } else {
//         delete bookObj.pdf;
//       }

//       return bookObj;
//     });

//     res.status(200).json(updatedBooks);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch books', error: error.message });
//   }
// };

// // Get single book by ID with nested info
// exports.getBookById = async (req, res) => {
//   try {
//     const book = await Book.findById(req.params.bookId).populate('categoryId');
//     if (!book) return res.status(404).json({ message: 'Book not found' });

//     const subscribed = req.user?.subscribed;

//     const bookData = book.toObject();
//     if (subscribed) {
//       bookData.pdfUrl = `${req.protocol}://${req.get('host')}/books/pdf/${book._id}`;
//     } else {
//       delete bookData.pdf;
//     }

//     res.status(200).json(bookData);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch book', error: error.message });
//   }
// };



// // Toggle Like
// exports.toggleLike = async (req, res) => {
//   try {
//     const book = await Book.findById(req.params.bookId);
//     if (!book) return res.status(404).json({ message: 'Book not found' });

//     book.like = !book.like;
//     await book.save();
//     res.status(200).json({ message: `Book like toggled`, like: book.like });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to toggle like', error: error.message });
//   }
// };



const Book = require('../Models/bookModel');
const Category = require('../Models/categoryModel');
const Review = require('../Models/Review');
const Like = require('../Models/Like');
const fs = require('fs');
const path = require('path');

// Add Book (local upload - images only)



const cloudinary = require('../config/cloudinary');


exports.addBook = async (req, res) => {
  try {
    const { name, about, language, category, authorName, authorPhoto, authorInfo } = req.body;

    const coverImageFile = req.files?.coverImage?.[0];
    const otherImageFiles = req.files?.otherImages || [];
    const pdfFiles = req.files?.pdf || [];

    let coverImageUrl = '';
    const otherImages = [];
    const pdfUrls = [];

    // Upload cover image
    if (coverImageFile) {
      const result = await cloudinary.uploader.upload(coverImageFile.path, {
        folder: 'books/images'
      });
      coverImageUrl = result.secure_url;
      fs.unlinkSync(coverImageFile.path);
    }

    // Upload other images
    for (const file of otherImageFiles) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'books/images'
      });
      otherImages.push(result.secure_url);
      fs.unlinkSync(file.path);
    }

    // Upload PDFs
    for (const pdf of pdfFiles) {
      const result = await cloudinary.uploader.upload(pdf.path, {
        resource_type: 'raw',
        folder: 'books/pdfs'
      });
      pdfUrls.push(result.secure_url);
      fs.unlinkSync(pdf.path);
    }
// const mongoose = require('mongoose');

// if (!mongoose.Types.ObjectId.isValid(category)) {
//   return res.status(400).json({ message: '❌ Invalid category ID format' });
// }


const newBook = new Book({


  name: name?.trim(),
  category: category?.trim(), // ensure no leading/trailing whitespace
  about: Array.isArray(about) ? about : [about],
  language: language?.trim(),
  images: {
    coverImage: coverImageUrl, // assumed to be a valid URL string
    otherImages,               // assumed to be an array of URLs
  },
  pdf: pdfUrls,                // assumed to be an array of URLs
  authorDetails: {
    name: authorName?.trim(),
    photo: authorPhoto?.trim(),
    info: authorInfo?.trim(),
  },
});


    await newBook.save();

    res.status(201).json({
      message: '✅ Book added successfully',
      book: newBook,
    });
  } catch (error) {
    console.error('❌ Error adding book:', error);
    res.status(500).json({ message: '❌ Failed to add book', error: error.message });
  }
};





// Get books by category
exports.getBooksByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const books = await Book.find({ category: categoryId });

    const enhancedBooks = await Promise.all(books.map(async book => {
      const reviews = await Review.find({ bookId: book._id }).populate('userId', 'firstname lastname');
      const likesCount = await Like.countDocuments({ bookId: book._id });
      const averageRating = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null;

      return {
        ...book.toObject(),
        reviews,
        likesCount,
        averageRating
      };
    }));

    res.json({ books: enhancedBooks });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to fetch books', error: error.message });
  }
};



// Get single book by ID
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId).populate('category');
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch book', error: error.message });
  }
};

// DELETE /api/books/delete-by-category/:categoryId
exports.deleteBooksByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    const books = await Book.find({ category: categoryId });
    if (!books.length) {
      return res.status(404).json({ message: 'No books found in this category' });
    }

    // ❌ Delete Cloudinary assets (optional cleanup)
    for (const book of books) {
      for (const img of book.images) {
        await cloudinary.uploader.destroy(img.public_id);
      }
      if (book.pdf?.public_id) {
        await cloudinary.uploader.destroy(book.pdf.public_id, { resource_type: 'raw' });
      }
    }

    // 🗑️ Delete books
    const result = await Book.deleteMany({ category: categoryId });

    res.status(200).json({
      message: '✅ Books deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Error deleting books by category:', error);
    res.status(500).json({ message: '❌ Failed to delete books', error: error.message });
  }
};


// PUT /api/books/update-by-category/:categoryId
exports.updateBooksByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const updateFields = req.body;

    // Check if category exists
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Update all books with the matching category
    const result = await Book.updateMany(
      { category: categoryId },
      { $set: updateFields }
    );

    res.status(200).json({
      message: '✅ Books updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Error updating books by category:', error);
    res.status(500).json({ message: '❌ Failed to update books', error: error.message });
  }
};


