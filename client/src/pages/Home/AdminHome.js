import * as React from 'react';
import {Container,Alert,AlertTitle,CircularProgress,Table,TableCell,TableContainer,TableBody,TableHead,Paper,TableRow,Button,Typography,Slide,Dialog,DialogActions,DialogTitle,DialogContent,DialogContentText,Grid,Card,CardContent,Modal,Box,Autocomplete,TextField,CardActions} from '@mui/material';
import ResponsiveAppBar from '../../layouts/Header';
import { addFoods, deleteFood, fetchFoods } from '../../redux/actions/foods';
import {fetchUserFoods,postFood,addFoodsToRender} from '../../redux/actions/user_foods';
import { connect } from 'react-redux';
import { useEffect, useState } from 'react';
import { getFoodData } from '../../nutritionx/nutritionx_api_call';
import { baseUrl } from '../../constants/base_url';
import moment from 'moment';
function AdminHome(props) {
  const [options, setOptions] = useState([]);
  const [foodDetails,setFoodDetails] =useState({
    value:null,
    open:false,
    selectedFood:null,
    selectedUser:null,
    showUpdate:false,
    showUserDetail:false,
    deleteDialog:false,
    showTresholdError:false,
    sevenDayDetails:[],
    sevenDayDateDetails:[],
    weekBeforeEntry:[],
  })
  const Transition = React.forwardRef(function Transition(props, ref) {return <Slide direction="up" ref={ref} {...props} />;});
  const style = {position: 'absolute',top: '50%',left: '50%',transform: 'translate(-50%, -50%)',width: 400,bgcolor: '#FFF',border: '2px solid #000',p: 4};
  const userDetailStyle = {position: 'absolute',top: '50%',left: '50%',transform: 'translate(-50%, -50%)',width: 700,bgcolor: '#FFF',border: '2px solid #000',p: 4,};
  const lastSevenDays = (foods, days) => {
    return foods.filter((food) => {
      const foodCreated = new Date(food.createdAt);
      const sevenDays = new Date(days * 8.64e7 - Date.now());
      return foodCreated > sevenDays;
    });
  };
  const sevenDaysBefore = (foods, days) => {
    return foods.filter((food) => {
      const foodCreated = new Date(food.createdAt);
      const sevenDays = new Date(days * 8.64e7 - Date.now());
      const fifteenDays = new Date(days * 1.21e9 - Date.now());// console.log(foodCreated, sevenDays);
      return foodCreated > fifteenDays && foodCreated < sevenDays;
    });
  };  
  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (parseInt(data.get('calorie')) + todaysCalories > DAILY_TRESHOLD) {
      setFoodDetails({
        ...foodDetails,
        showTresholdError:true
      })//setShowTresholdError(true);
      return;
    }
    props.postFood({name: data.get('food-name'),calorie: data.get('calorie'),});
  };
  const handleUpdate = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    return fetch(baseUrl + 'foods/' + foodDetails.selectedFood._id, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json',},
      body: JSON.stringify({name: data.get('update-food-name'),calorie: data.get('update-calorie'),}),
    })
      .then(
        (response) => {
          if (response.ok) {
            return response;
          } else {
            const error = new Error('Error ' + response.status + ': ' + response.statusText);
            error.response = response;
            throw error;}},
        (error) => {throw error;}
      ).then((response) => response.json()).then((response) => {props.addAllFoods(response);}).catch((error) => {console.log(error.message);});
  };

  const DAILY_TRESHOLD = 2100;
  useEffect(() => {
    props.fetchFoods();
    props.fetchUserFoods();
    getFoodData().then((result) => setOptions(result.hits)).catch((error) => setOptions([]));
  }, []);
  const handleOpen = () => setFoodDetails({...foodDetails,open:true })
  const handleClose = () => {setFoodDetails({...foodDetails,open:false,value:null });};
  useEffect(() => {
    if(props.Foods.foods.length > 0){
      let Food = props.Foods.foods,sevenDayDetails = {},sevenDayDateDetails = [],result = [],weekBeforeEntry = {}
      let sevenDayBelow = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      sevenDayBelow = moment(sevenDayBelow).format('DD-MM-YYYY');
      let CurrentDate = moment(new Date()).format('DD-MM-YYYY');
      let Currentdate = new Date();
      let first = Currentdate.getDate() - Currentdate.getDay();
      let WeekFirstDate = moment(new Date(Currentdate.setDate(first)).toUTCString()).format('DD-MM-YYYY');  
      Food.forEach(item => {
        let UserDate= moment(item.createdAt).format('DD-MM-YYYY'); 
        if(UserDate <= CurrentDate && UserDate >= sevenDayBelow){
          sevenDayDateDetails.push(item)
          if(sevenDayDetails[item.user.name]){  
            sevenDayDetails[item.user.name] = {
              dayEntryCount: sevenDayDetails[item.user.name].dayEntryCount + 1,
              calorie: sevenDayDetails[item.user.name].calorie + item.calorie,
            }
          }
          else{
            sevenDayDetails[item.user.name] = {
              dayEntryCount: 1,
              calorie: item.calorie,
            }
          }
        }
        if(WeekFirstDate >= UserDate){
          if(weekBeforeEntry[item.user.name]){  
            weekBeforeEntry[item.user.name] = {
              dayEntryCount: weekBeforeEntry[item.user.name].dayEntryCount + 1,
              calorie: weekBeforeEntry[item.user.name].calorie + item.calorie,
            }
          }
          else{
            weekBeforeEntry[item.user.name] = {
              dayEntryCount: 1,
              calorie: item.calorie,
            }
          }
        }
      })
      for (let prop in sevenDayDetails){
          if (sevenDayDetails[prop] >=2){result.push(prop)}
      }
      setFoodDetails({...foodDetails,sevenDayDetails,result,sevenDayDateDetails,weekBeforeEntry})
    }
  }, [props.Foods.foods]);
  const todaysFoods = props.UserFoods.userFoods.filter((food) => {
    const foodCreated = new Date(food.createdAt);
    const today = new Date(Date.now());
    return foodCreated.getDay() === today.getDay();
  });
  let todaysCalories = 0;
  for (let food of todaysFoods) {todaysCalories += food.calorie}
  const handleCloseDialog = () => {  setFoodDetails({ ...foodDetails,deleteDialog:false})};
  const handleCloseUserDetail = () => {setFoodDetails({...foodDetails,showUserDetail:false })};
  let usersFoods,sevenDaysFoods,sevenDaysCalories,fifteenDaysFoods,fifteeenDayCalories;
  if (foodDetails.selectedUser) {
    usersFoods = props.Foods.foods.filter((food) => food.user._id === foodDetails.selectedUser._id);
    sevenDaysFoods = lastSevenDays(usersFoods, 7);
    fifteenDaysFoods = sevenDaysBefore(usersFoods, 15);
    fifteeenDayCalories = 0;
    sevenDaysCalories = 0;
    for (let food of sevenDaysFoods) {
      sevenDaysCalories += food.calorie;
    }
    for (let food of fifteenDaysFoods) {
      fifteenDaysFoods += food.calorie;
    }
  }
  if (props.Foods.isLoading) {
    return (
      <Container>
        <ResponsiveAppBar />
        <Container style={{ marginTop: '100px', backgroundColor: '#FCFAFB' }}>
          <div className="container">
            <div className="row"><div style={{display: 'flex',justifyContent: 'center',marginTop: '100px',marginBottom: '75px'}}><CircularProgress size={'50px'}/></div></div>
          </div>
        </Container>
      </Container>
    );
  } else if (props.Foods.errorMessage) {
    return (
      <Container>
        <ResponsiveAppBar />
        <Container style={{ marginTop: '100px', backgroundColor: '#FCFAFB' }}>
          <div className="container">
            <div className="row" style={{ display: 'flex', justifyContent: 'center' }}>
              <Alert style={{ margin: '50px', padding: '50px' }} severity="error" ><AlertTitle style={{ fontWeight: 'bold' }}>Error</AlertTitle><strong>{props.UserFoods.errorMessage}</strong></Alert>
            </div>
          </div>
        </Container>
      </Container>
    );
  } else if (props.Foods.foods.length >= 1) {
    const defaultProps = { options: options.map((option) => option.fields), getOptionLabel: (option) => option.item_name || option};
    return (
      <Container>
        <Modal open={foodDetails.open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
          <Box sx={style} component="form" onSubmit={handleSubmit} noValidate>
            <Typography id="modal-modal-title" variant="h6" component="h2" gutterBottom>Add Food</Typography>
            <Typography variant="body1">Food</Typography>
            <Autocomplete {...defaultProps} freeSolo value={foodDetails.value} onChange={(event, newValue) => { setFoodDetails({ ...foodDetails,value:newValue});}}
              renderInput={(params) => ( <TextField {...params} margin="normal" required fullWidth id="food-name" name="food-name" autoComplete="current-food" autoFocus /> )}
            />
            <Typography variant="body1">Calorie</Typography>
            <TextField value={ typeof foodDetails.value !== 'string' && foodDetails.value !== null ? foodDetails.value.nf_calories : null } margin="normal" required fullWidth hiddenLabel variant="outlined" name="calorie" type="number" id="calorie" autoComplete="current-calorie" />
            <Grid container spacing={2}>
              <Grid item xs={6}> <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>Add</Button> </Grid>
              <Grid item xs={6}> <Button fullWidth onClick={handleClose} variant="contained" sx={{ mt: 3, mb: 2 }}>CLOSE</Button></Grid>
            </Grid>
            {foodDetails.showTresholdError === true ? (<Typography variant="body1">Above the daily Treshold</Typography>) : null}
          </Box>
        </Modal>
        <ResponsiveAppBar />
        <Card sx={{ minWidth: 275, marginTop: 8, marginBottom: 8 }}>
          <CardActions><Button disabled={todaysCalories >= DAILY_TRESHOLD} onClick={handleOpen} size="large">{todaysCalories >= DAILY_TRESHOLD? 'Daily Treshold Reached': 'Add food'}</Button></CardActions>
        </Card>
        {foodDetails.selectedFood && (<>
            <Dialog open={foodDetails.deleteDialog} TransitionComponent={Transition} onClose={handleCloseDialog} aria-describedby="alert-dialog-slide-description">
                <DialogTitle>{'Remove Item?'}</DialogTitle>
                <DialogContent><DialogContentText id="alert-dialog-slide-description">Do you really want to remove this item?</DialogContentText></DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseDialog}>CANCEL</Button>
                  <Button onClick={() => {props.deleteFood(foodDetails.selectedFood._id);handleCloseDialog();}}>REMOVE</Button>
                </DialogActions>
            </Dialog>
            <Modal open={foodDetails.showUpdate} onClose={() => setFoodDetails({...foodDetails,showUpdate:false})} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
              <Box sx={style} component="form" onSubmit={handleUpdate} noValidate>
                <Typography id="modal-modal-title" variant="h6" component="h2" gutterBottom>Update Food</Typography>
                <Typography variant="body1">Food</Typography>
                <TextField placeholder={foodDetails.selectedFood.name} margin="normal" required fullWidth id="update-food-name" name="update-food-name" autoComplete="current-food" autoFocus />
                <Typography variant="body1">Calorie</Typography>
                <TextField placeholder={foodDetails.selectedFood.calorie} margin="normal" required fullWidth variant="outlined" name="update-calorie" type="number" id="update-calorie" autoComplete="current-calorie" />
                <Grid container spacing={2}>
                  <Grid item xs={6}><Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}> Update </Button> </Grid>
                  <Grid item xs={6}><Button fullWidth onClick={() => setFoodDetails({...foodDetails,showUpdate:false})}variant="contained"sx={{ mt: 3, mb: 2 }}>CLOSE</Button></Grid>
                </Grid>
              </Box>
            </Modal></>
        )}
        <Grid container marginBottom="16px"><Grid item><Typography variant="h5" color="text.primary">Food Entries Report</Typography></Grid></Grid>
        <TableContainer component={Paper}>
          <Table size="small" aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell>Food</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Calories</TableCell>
                <TableCell>Date and Time</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {props.Foods.foods.map((food) => (
                <TableRow key={food._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">{food.name}</TableCell>
                  <TableCell>{food.user.name}</TableCell>
                  <TableCell>{food.calorie}</TableCell>
                  <TableCell>{new Date(food.createdAt).toUTCString()}</TableCell>
                  <TableCell>
                    <Grid container spacing={8} alignItems="center">
                      <Grid item xs={4}><Button onClick={() => {setFoodDetails({...foodDetails,showUpdate:true,selectedFood:food})}}variant="contained" color="primary">Update</Button></Grid>
                      <Grid item xs={4}><Button onClick={() => {setFoodDetails({ ...foodDetails,deleteDialog:true,selectedFood:food})}} variant="contained" color="secondary">Delete</Button></Grid>
                    </Grid>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Grid container marginBottom="16px"><Grid item><Typography variant="h5" color="text.primary">Food Report</Typography></Grid></Grid>
        <TableContainer>
          <Table size="small" aria-label="a dense table">
            <TableHead >
              <TableRow key={1}>
                <TableCell rowSpan={2}>No</TableCell>
                <TableCell rowSpan={2}>User</TableCell>
                <TableCell colSpan={2} align='center'>The Last 7 Days</TableCell>
                <TableCell rowSpan={2}>The Week Before Number of Entries</TableCell>
              </TableRow>
              <TableRow key={2}>
                <TableCell>Number of Entries</TableCell>
                <TableCell>Average Daily Calories</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {
                Object.keys(foodDetails.sevenDayDetails).map((data,index)=>(
                 <TableRow>
                    <TableCell>{index+1}</TableCell>
                    <TableCell>{data}</TableCell>
                    <TableCell>{foodDetails.sevenDayDetails[data].dayEntryCount}</TableCell>
                    <TableCell>{foodDetails.sevenDayDetails[data].calorie}</TableCell>
                    <TableCell>{foodDetails?.weekBeforeEntry[data]?.dayEntryCount ?? 0}</TableCell>
                 </TableRow>
                  )
                )
              }
              
            </TableBody>
          </Table>
        </TableContainer>
        {foodDetails.selectedUser && (
          <Modal open={foodDetails.showUserDetail} onClose={handleCloseUserDetail} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description" >
            <Box sx={userDetailStyle}>
              <Grid container justifyContent="center" marginTop="16px">
                <Grid item><Typography variant="h5" color="text.primary">{`2 Weeks Stats Details: ${foodDetails.selectedUser.name}`}</Typography></Grid>
              </Grid>
              <Grid container spacing={2} justifyContent="center">
                <Grid item sm={6}>
                  <Card sx={{ minWidth: 275, marginTop: 8 }}>
                    <CardContent>
                      <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>{`Today: ${new Date(Date.now()).toUTCString()}`}</Typography>
                      <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>Last 7 Days:</Typography>
                      <Typography sx={{ mb: 1.5 }} variant="h5" color="text.secondary">{`Total Calories: ${sevenDaysCalories}`}</Typography>
                      <Typography sx={{ mb: 1.5 }} variant="h5" color="text.secondary" >{`Number of Entries: ${sevenDaysFoods.length}`}</Typography>
                      <Typography variant="h5">{`Average Daily Calories: ${parseInt(sevenDaysCalories / 7)}`}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item sm={6}>
                  <Card sx={{ minWidth: 275, marginTop: 8 }}>
                    <CardContent>
                      <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom >{`Today: ${new Date(Date.now()).toUTCString()}`}</Typography>
                      <Typography variantsx={{ fontSize: 14 }} color="text.secondary" gutterBottom>7 Days Before:</Typography>
                      <Typography sx={{ mb: 1.5 }} variant="h5" color="text.secondary" > {`Total Calories: ${fifteeenDayCalories}`} </Typography>
                      <Typography sx={{ mb: 1.5 }} variant="h5" color="text.secondary">{`Number of Entries: ${fifteenDaysFoods.length}`}</Typography>
                      <Typography variant="h5">{`Average Daily Calories: ${parseInt(fifteeenDayCalories / 7)}`}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid container justifyContent="end"><Grid item xs={6}><Button fullWidth onClick={handleCloseUserDetail} variant="contained" sx={{ mt: 3, mb: 2 }}>CLOSE</Button></Grid></Grid>
              </Grid>
            </Box>
          </Modal>
        )}
      </Container>
    );
  } else {
    return (
      <Container>
        <ResponsiveAppBar />
        <Container style={{ marginTop: '100px', backgroundColor: '#FCFAFB' }}>
          <div className="container">
            <div className="row" style={{ display: 'flex', justifyContent: 'center' }} >
              <Alert style={{ margin: '50px', padding: '50px' }} severity="info"><AlertTitle style={{ fontWeight: 'bold' }}>Oops!</AlertTitle><strong>No Food Entries Found!</strong></Alert>
            </div>
          </div>
        </Container>
      </Container>
    );
  }
}
const mapStateToProps = (state) => {return {Foods: state.Foods,UserFoods: state.UserFoods,auth: state.auth,};};
const mapDispatchToProps = (dispatch) => ({
  fetchFoods: (e) => dispatch(fetchFoods(e)),
  deleteFood: (foodId) => dispatch(deleteFood(foodId)),
  fetchUserFoods: () => dispatch(fetchUserFoods()),
  postFood: (food) => dispatch(postFood(food)),
  addFoods: (foods) => dispatch(addFoodsToRender(foods)),
  addAllFoods: (foods) => dispatch(addFoods(foods)),
});
export default connect(mapStateToProps, mapDispatchToProps)(AdminHome);