const express = require('express');
const fs = require('fs');

const router = express.Router();

const tours = JSON.parse(
    fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
  );

const getAllTours = (req, res) => {
    console.log(req.requestTime);
    res.status(200).json({
      status: "success",
      requestedAt: req.requestTime,
      results: tours.length,
      data: {
        tours
      }
    });
  };
  
  const getTourById = (req, res) => {
    const id = req.params.id * 1;
  
    const tour = tours.find(el => el.id === id);
  
    if (!tour) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid ID"
      });
    }
  
    res.status(200).json({
      status: "success",
      data: {
        tour
      }
    });
  };
  
  const createTour = (req, res) => {
    const newId = tours[tours.length - 1].id + 1;
    const newTour = Object.assign({ id: newId }, req.body);
  
    tours.push(newTour);
    fs.writeFile(
      `${__dirname}/dev-data/data/tours-simple.json`,
      JSON.stringify(tours),
      err => {
        res.status(201).json({
          status: "success",
          data: {
            tour: newTour
          }
        });
      }
    );
  };
  
  const updateTour = (req, res) => {
    if (req.params.id * 1 > tours.length) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid ID"
      });
    }
  
    res.status(200).json({
      status: "success",
      data: {
        tour: "<Updated tour here..."
      }
    });
  };
  
  const deleteTour = (req, res) => {
    if (req.params.id * 1 > tours.length) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid ID"
      });
    }
  
    res.status(204).json({
      status: "success",
      data: null
    });
  };

router
.route("/")
  .get(getAllTours)
  .post(createTour);
  
router
.route("/:id")
  .get(getTourById)
  .patch(updateTour)
  .delete(deleteTour);

module.exports = router;