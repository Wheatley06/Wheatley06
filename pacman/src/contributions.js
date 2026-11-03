
const GITHUB_API = "https://api.github.com/graphql";

const CONTRIBUTIONS_QUERY = `
  query($username: String!) {
    user(login: $username) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              color
            }
          }
        }
      }
    }
  }
`;

export async function fetchContributions(username, token) {
  if (!username || !token) {
    throw new Error("GitHub username and token are required.");
  }

  const response = await fetch(GITHUB_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: CONTRIBUTIONS_QUERY,
      variables: { username },
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const result = await response.json();

  if (result.errors?.length) {
    throw new Error(result.errors[0].message);
  }

  const calendar = result.data?.user?.contributionsCollection
    ?.contributionCalendar;

  if (!calendar) {
    throw new Error("Contribution calendar not found.");
  }

  return {
    totalContributions: calendar.totalContributions,
    days: calendar.weeks.flatMap((week) =>
      week.contributionDays.map((day) => ({
        date: day.date,
        count: day.contributionCount,
      }))
    ),
  };
}
