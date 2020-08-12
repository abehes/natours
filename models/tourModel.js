const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have at most 40 characters'],
      minlength: [5, 'A tour name must have at least 5 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain letters'] //3rd Party validation technique
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a maxGroupSize']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, medium or difficult'
      } 
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'A rating must be above 1.0'],
      max: [5, 'A rating must be below 5.0']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // this only points to current document only on NEW document creation
          return val < this.price;
        },
        message: 'The discount price cannot exceed the price of the tour.'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a imageCover']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    }
  },
  {
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  }
);

// VIRTUAL PROPERTIES
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// DOCUMENT MIDDLEWARE
//You can have multiple middlewares for a hook, {hook = save for example}
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, {lower: true});
  next();
});


// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
//   /^find/ - triggers this middleware for all hooks that start with 'find'
tourSchema.pre(/^find/, function(next) { 
  this.find({secretTour: {$ne: true}});

  this.start = Date.now();
  next();
});

// tourSchema.post(/^find/, function(docs, next) { 
//   console.log(`Query took: ${Date.now() - this.start} ms`);
//   //console.log(docs);
//   next();
// });

// AGGREGATION MIDDLEWARE
// .unshift() allows us to add an element at the beginning of the array
tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: {secretTour: {$ne: true}}});
  next();
});


const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
