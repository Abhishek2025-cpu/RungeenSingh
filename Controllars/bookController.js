const Book = require('../Models/bookModel');
const Category = require('../Models/categoryModel');
const cloudinary = require('cloudinary').v2;



// Upload utility
const uploadImageToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'books', resource_type: 'image' },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(fileBuffer);
  });
};

// Add Book




exports.addBook = async (req, res) => {
  try {
    const { name, author, about, language, category } = req.body;
    const files = req.files;

    // Upload images to Cloudinary
    // Upload images
const uploadedImages = await Promise.all(
  (files.images || []).map(file =>
    cloudinary.uploader.upload(file.path, { folder: 'books/images' })
  )
);

// Upload PDF
const uploadedPdf = files.pdf?.[0];
if (!uploadedPdf) {
  return res.status(400).json({ message: "PDF file is required" });
}

const newBook = new Book({
  name,
  author,
  about,
  language,
  categoryId: category,
  images: uploadedImages,
  pdf: {
    data: require('fs').readFileSync(uploadedPdf.path),
    contentType: uploadedPdf.mimetype,
    originalName: uploadedPdf.originalname,
  },
  like: false,
  isSubscribed: false,
});

    await newBook.save();

    res.status(201).json({
      message: '✅ Book added successfully',
      book: newBook,
    });

  } catch (error) {
    console.error("❌ Error adding book:", error);
    res.status(500).json({ message: "❌ Failed to add book", error: error.message });
  }
};



exports.getPdfByBookId = async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    if (!book || !book.pdf?.file) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    res.set({
      'Content-Type': book.pdf.mimetype,
      'Content-Disposition': `inline; filename="${book.pdf.filename}"`,
    });

    res.send(book.pdf.file);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch PDF', error: error.message });
  }
};


// Get all books for a category
exports.getBooksByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const subscribed = req.user?.subscribed;

    const books = await Book.find({ categoryId }).sort({ createdAt: -1 }).populate('categoryId');

    const updatedBooks = books.map(book => {
      const bookObj = book.toObject();

      // Add PDF URL only if subscribed
      if (subscribed) {
        bookObj.pdfUrl = `${req.protocol}://${req.get('host')}/books/pdf/${book._id}`;
      } else {
        delete bookObj.pdf;
      }

      return bookObj;
    });

    res.status(200).json(updatedBooks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch books', error: error.message });
  }
};

// Get single book by ID with nested info
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId).populate('categoryId');
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const subscribed = req.user?.subscribed;

    const bookData = book.toObject();
    if (subscribed) {
      bookData.pdfUrl = `${req.protocol}://${req.get('host')}/books/pdf/${book._id}`;
    } else {
      delete bookData.pdf;
    }

    res.status(200).json(bookData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch book', error: error.message });
  }
};



// Toggle Like
exports.toggleLike = async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    book.like = !book.like;
    await book.save();
    res.status(200).json({ message: `Book like toggled`, like: book.like });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle like', error: error.message });
  }
};
