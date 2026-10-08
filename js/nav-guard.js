// A view (the running mock exam) can ask for a confirmation before the router leaves it.
let guard = null;
export const setLeaveGuard = (fn) => { guard = fn; };
export const getLeaveGuard = () => guard;
