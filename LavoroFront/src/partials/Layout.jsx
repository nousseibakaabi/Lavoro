import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./header";
import Footer from "./footer";
import Loader from "./loader";
import Switcher from "./switcher";
import ResponsiveSearchModal from "./responsive-search-modal";
import CommonJs from "./commonjs";
import MainHead from "./mainhead";

const Layout = () => {
  const [loading, setLoading] = useState(false);

  return (
    <>
      {loading && <Loader />}
      <div className="page">
        <MainHead />
        <Switcher />
        <Header /> {/* Sidebar is now handled inside the Header component */}
        <div className="main-content app-content">
          <div className="container-fluid">
            {/* Outlet will render the matched child route */}
            <Outlet />
          </div>
        </div>
        <Footer />
        <ResponsiveSearchModal />
      </div>
      <CommonJs />
    </>
  );
};

export default Layout;