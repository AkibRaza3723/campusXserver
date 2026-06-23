

const verifiedEmail = (email) => {

    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!emailRegex.test(email)) {
        return false;
    }
    const domain = email.split('@')[1].toLowerCase();
    if (domain === "st.jmi.ac.in" || domain === "ietlucknow.ac.in") {
        return true;
    }
    return false;
}
export default verifiedEmail;