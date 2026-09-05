function DashboardCard({
    title,
    onClick
}) {

    return (

        <button
            type="button"
            className="dashboard-card"
            onClick={onClick}
        >
            {title}
        </button>

    );

}


export default DashboardCard;