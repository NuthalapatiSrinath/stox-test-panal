export const onlySuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'super_admin') {
    console.log(req.user?.role)
    return res.status(403).json({ message: "Access denied. Super admin only." });
  }
  next();
};