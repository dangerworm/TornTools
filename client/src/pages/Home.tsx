import {
  Card,
  CardContent,
  Divider,
  Grid,
  Typography,
} from "@mui/material";
import { Link } from "react-router";
import { useItems } from "../hooks/useItems";
import Loading from "../components/Loading";
import { menuItems } from "../constants/Menu";

const Home = () => {
  const { loading } = useItems();

  return (
    <>
      <Typography variant="body1" gutterBottom>
        This website hosts a collection of tools for the game{" "}
        <a
          href="https://www.torn.com/index.php"
          target="_blank"
          rel="noopener noreferrer"
        >
          Torn
        </a>
        .
      </Typography>
      <Typography variant="body1" gutterBottom>
        This is a personal project and not affiliated with Torn or its
        developers. Use at your own risk.
      </Typography>

      <Divider sx={{ mt: 3 }} />
      {loading && <Loading message="Loading items..." />}

      {!loading && (
        <>
          <Typography gutterBottom sx={{ mt: 3 }} variant="h5" >
            Tools
          </Typography>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {menuItems
              .filter((item) => item.showOnHomePage)
              .map((item) => (
                <Grid key={item.address} size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined" sx={{ height: "100%" }}>
                    <CardContent>
                      <Typography variant="h5" gutterBottom>
                        <Link to={item.address} className="no-underline">
                          {item.title}
                        </Link>
                      </Typography>
                      <Typography variant="body1">{item.subTitle}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </>
      )}
    </>
  );
};

export default Home;
