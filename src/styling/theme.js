const sharedTheme = theme => ({
  root: {
    flexGrow: 1,
    height: 50,
    display: 'flex',
    flexWrap: 'wrap',
  },
  button: {
    margin: '0px',
  },
  functionButton: {
    margin: '10px',
    padding: '0px',
  },
  formControl: {
    margin: theme.spacing(),
    width: '250px',
    color: 'black',
  },
  boxDialpad: {
    marginTop: theme.spacing(5),
    paddingTop: theme.spacing(5),
    paddingLeft: theme.spacing(2),
    borderTop: '1px solid #eeeeee',
    height: '500px',
    borderBottom: '1px solid #eeeeee',
  },
  titleAgentDialpad: {
    width: '100%',
    textTransform: 'uppercase',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: theme.spacing(4),
    fontSize: theme.typography.fontSize,
  },
  subtitleDialpad: {
    marginLeft: theme.spacing(),
    textTransform: 'uppercase',
  },
  buttonAgentDialpad: {
    marginTop: theme.spacing(2),
    display: 'flex',
    justifyContent: 'center',
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
  backspace: {
    paddingTop: '5px',
    margin: '0px',
  },
  dialPadBtn: {
    borderRadius: '100px',
    padding: '10px',
    minWidth: '0px',
  },
});

export default sharedTheme;
