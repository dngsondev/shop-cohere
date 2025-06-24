import { Banner } from "../../components";
import { OutstandingProduct, ProductForYou } from "../../features/Products";

function Home() {
    return (
        <>
            {/* Banner */}
            {/* <div className="w-full"> */}
            <Banner />
            {/* </div> */}

            {/* Sản phẩm nổi bật */}
            <OutstandingProduct />

            {/* Dành cho bạn */}
            <ProductForYou />
        </>
    );
}

export default Home;
