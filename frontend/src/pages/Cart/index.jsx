import CartItem from "../../features/Cart/CartItem";

function Cart() {

    const customerData = localStorage.getItem("user");
    const customer = JSON.parse(customerData);
    const customerId = customer.id;

    return (
        <div>
            <CartItem customerId={customerId} />
        </div>
    );
}

export default Cart;